const Message = require('../models/Message');
const Chat = require('../models/Chats'); // ✅ استيراد جدول المحادثات

// 🟢 إرسال رسالة
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Message = require('../models/Message');
const Chat = require('../models/Chats');

// إعداد Supabase
const supabase = createClient(
  'https://iwnqfkblmlkndwiybvsj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bnFma2JsbWxrbmR3aXlidnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTEwMDksImV4cCI6MjA2Njk2NzAwOX0.tU3vhSHFFaiUceQ3cQoapAPdRxN5PmS17OXqlnTUP4U'
);

// إعداد multer
const upload = multer({ dest: 'uploads/' });

// 🟢 إرسال رسالة نص/صوت
exports.sendMessage = [
  upload.single('audio'),
  async (req, res) => {
    try {
      const sender = req.user.id;
      const { receiver, text } = req.body;

      let audioUrl = null;

      // ✅ رفع الصوت إن وجد
      if (req.file) {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = `audios/${Date.now()}_${req.file.originalname}`;

        const { data, error } = await supabase.storage
          .from('audios')
          .upload(fileName, fileBuffer, {
            contentType: req.file.mimetype,
            upsert: true,
          });

        fs.unlinkSync(filePath); // حذف الملف من السيرفر

        if (error) {
          return res.status(500).json({ error: 'خطأ في رفع الصوت', details: error.message });
        }

        audioUrl = `https://iwnqfkblmlkndwiybvsj.supabase.co/storage/v1/object/public/${data.path}`;
      }

      // ✅ إنشاء الرسالة
      const message = new Message({ sender, receiver, text, audioUrl });
      await message.save();

      // ✅ تحديث أو إنشاء محادثة
      let chat = await Chat.findOne({ users: { $all: [sender, receiver] } });

      const latestMessage = text || '🎤 رسالة صوتية';

      if (!chat) {
        chat = new Chat({
          users: [sender, receiver],
          lastMessage: latestMessage,
          updatedAt: new Date(),
        });
      } else {
        chat.lastMessage = latestMessage;
        chat.updatedAt = new Date();
      }

      await chat.save();

      res.status(201).json(message);
    } catch (err) {
      console.error('❌ Send Message Error:', err);
      res.status(500).json({
        error: 'فشل إرسال الرسالة',
        message: err.message,
      });
    }
  }
];
// 🔵 جلب الرسائل بين مستخدمين
exports.getMessages = async (req, res) => {
  try {
    const { user2 } = req.params;
    const user1 = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// 🔴 حذف رسالة
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await Message.findByIdAndDelete(messageId);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('❌ Delete Message Error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};


