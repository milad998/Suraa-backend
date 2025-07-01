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
const chatsRoutes = require('./routes/chatsRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const Message = require('./models/Message'); // ✅ استيراد الموديل

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// ✅ Middleware

app.use(cors({
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // كل 15 دقيقة
  max: 100, // 100 طلب فقط
  message: { error: 'Too many requests, please try again later.' }
});

app.use(xss());           // ✅ يمنع XSS
app.use(mongoSanitize()); // ✅ يمنع NoSQL injection

app.use(helmet()); // ✅ قبل الراوترات
app.use(limiter); // ✅ قبل الراوترات
// ✅ API Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatsRoutes);
// ✅ Socket.IO
io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  // 📌 المستخدم يرسل معرفه للانضمام لغرفة خاصة
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`🟡 User ${userId} joined their room`);
  });

  // 📩 إرسال رسالة: تخزين + بث للطرف الآخر فقط
  socket.on('sendMessage', async (data) => {
    try {
      const { sender, receiver, text } = data;
      const newMessage = new Message({ sender, receiver, text });
      await newMessage.save();

      // إرسال للطرف المستقبل فقط
      io.to(receiver).emit('receiveMessage', newMessage);
    } catch (err) {
      console.error('❌ Error saving message:', err.message);
    }
  });
  socket.on('deleteMessage', async (data) => {
  try {
    const { messageId, receiverId } = data;
    await Message.findByIdAndDelete(messageId);

    // إعلام الطرف الآخر
    io.to(receiverId).emit('messageDeleted', { messageId });
  } catch (err) {
    console.error('❌ Socket Delete Error:', err);
  }
});
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// ✅ Port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
