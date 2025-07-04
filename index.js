const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ✅ Supabase إعداد
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ✅ Multer لتخزين الملفات مؤقتًا
const upload = multer({ dest: 'uploads/' });

// ✅ Express
const app = express();
const server = http.createServer(app);

// ✅ Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'DELETE']
  }
});

// ✅ MongoDB اتصال
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.log('❌ MongoDB connection error:', err.message));

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, try again later.' }
}));

// ✅ Routes
const chatsRoutes = require('./routes/chatsRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const Message = require('./models/Message');

app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatsRoutes);

// ✅ تتبع المستخدمين المتصلين
const onlineUsers = new Map(); // userId => socket.id

// ✅ Socket.IO Events
io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  // ✅ عند الانضمام
  socket.on('join', (userId) => {
    if (!userId) return;
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    console.log(`🟡 User ${userId} joined`);

    // بث المستخدمين المتصلين للجميع
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  // ✅ يكتب الآن
  socket.on('typing', ({ from, to }) => {
    if (!from || !to) return;
    io.to(to).emit('typing', { from });
  });

  socket.on('stopTyping', ({ from, to }) => {
    if (!from || !to) return;
    io.to(to).emit('stopTyping', { from });
  });

  // ✅ إرسال رسالة
  socket.on('sendMessage', async (data) => {
    try {
      const { sender, receiver, text, audioBase64, audioName, audioType } = data;
      if (!sender || !receiver || (!text && !audioBase64)) {
        return socket.emit('errorMessage', { error: 'بيانات ناقصة' });
      }

      let audioUrl = null;

      if (audioBase64) {
        const buffer = Buffer.from(audioBase64, 'base64');

        const mimeTypes = {
          '.aac': 'audio/aac',
          '.mp3': 'audio/mpeg',
          '.wav': 'audio/wav',
          '.ogg': 'audio/ogg',
          '.m4a': 'audio/mp4',
        };

        const ext = path.extname(audioName || '').toLowerCase();
        const contentType = mimeTypes[ext] || audioType || 'audio/mpeg';

        const fileName = `${Date.now()}_${audioName || 'audio.mp3'}`;

        const { error } = await supabase
          .storage
          .from('voice')
          .upload(fileName, buffer, {
            contentType,
            upsert: true,
          });

        if (error) {
          console.error('❌ رفع الصوت فشل:', error.message);
          return socket.emit('errorMessage', { error: 'فشل في رفع الصوت', details: error.message });
        }

        audioUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/voice/${fileName}`;
      }

      const newMessage = new Message({ sender, receiver, text, audioUrl });
      await newMessage.save();

      io.to(receiver).emit('receiveMessage', newMessage);
      socket.emit('messageSent', { success: true, message: newMessage });

    } catch (err) {
      console.error('❌ Error sending message:', err.message);
      socket.emit('errorMessage', { error: 'فشل في إرسال الرسالة' });
    }
  });

  // ✅ حذف رسالة
  socket.on('deleteMessage', async (data) => {
    try {
      const { messageId, receiverId } = data;
      if (!messageId || !receiverId) {
        return socket.emit('errorMessage', { error: 'بيانات ناقصة' });
      }

      await Message.findByIdAndDelete(messageId);
      io.to(receiverId).emit('messageDeleted', { messageId });
      socket.emit('deleteSuccess', { messageId });

    } catch (err) {
      console.error('❌ Socket Delete Error:', err.message);
      socket.emit('errorMessage', { error: 'فشل في حذف الرسالة' });
    }
  });

  // ✅ عند قطع الاتصال
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);

    for (const [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    // بث الحالة الجديدة بعد الخروج
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
