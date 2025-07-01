const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// استيراد الراوترات والموديل
const chatsRoutes = require('./routes/chatsRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// ✅ إعداد Socket.IO مع CORS أكثر أمانًا
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST','DELETE']
  }
});

// ✅ اتصال MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.log('❌ MongoDB connection error:', err.message));

// ✅ Middleware
app.use(cors({
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // كل 15 دقيقة
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(xss());
app.use(mongoSanitize());
app.use(helmet());
app.use(limiter);

// ✅ الراوترات
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatsRoutes);

// ✅ Socket.IO Events
io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  // 📌 المستخدم ينضم لغرفته الخاصة
  socket.on('join', (userId) => {
    if (!userId) {
      console.warn('❌ join: userId مفقود');
      return;
    }
    socket.join(userId);
    console.log(`🟡 User ${userId} joined their room`);
  });

  // 📩 إرسال رسالة
  socket.on('sendMessage', async (data) => {
    try {
      const { sender, receiver, text } = data;

      // تحقق من صحة البيانات
      if (!sender || !receiver || !text?.trim()) {
        return socket.emit('errorMessage', { error: 'Invalid message data' });
      }

      const newMessage = new Message({ sender, receiver, text });
      await newMessage.save();

      // إرسال للطرف المستقبل فقط
      io.to(receiver).emit('receiveMessage', newMessage);

      // تأكيد للمرسل
      socket.emit('messageSent', { success: true, message: newMessage });

    } catch (err) {
      console.error('❌ Error saving message:', err.message);
      socket.emit('errorMessage', { error: 'Server error while sending message' });
    }
  });

  // 🗑️ حذف رسالة
  socket.on('deleteMessage', async (data) => {
    try {
      const { messageId, receiverId } = data;

      if (!messageId || !receiverId) {
        return socket.emit('errorMessage', { error: 'Invalid delete request' });
      }

      await Message.findByIdAndDelete(messageId);

      // إعلام الطرف الآخر
      io.to(receiverId).emit('messageDeleted', { messageId });

      // تأكيد للمرسل
      socket.emit('deleteSuccess', { messageId });

    } catch (err) {
      console.error('❌ Socket Delete Error:', err);
      socket.emit('errorMessage', { error: 'Server error while deleting message' });
    }
  });

  // 🔌 قطع الاتصال
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));