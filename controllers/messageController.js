const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Message = require('../models/Message');
const Chat = require('../models/Chats');

// إعداد Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 🟢 إرسال رسالة (نص أو صوت)
exports.sendMessage = async (req, res) => {
  try {
    const sender = req.user.id;
    const { receiver, text } = req.body;

    if (!receiver) {
      return res.status(400).json({ error: 'الرجاء تحديد المستقبل' });
    }

    let audioUrl = null;

    if (req.file) {
      const filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);

      // تنظيف اسم الملف من الرموز غير المسموحة
      const original = req.file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const fileName = `${Date.now()}_${original}`;

      // تحديد نوع المحتوى بناءً على امتداد الملف
      const mimeTypes = {
  '.aac': 'audio/aac',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.webm': 'audio/webm', // ✅ أضف هذا السطر
};

      const ext = path.extname(req.file.originalname).toLowerCase();
      const contentType = mimeTypes[ext] || req.file.mimetype || 'application/octet-stream';

      console.log('file extension:', ext);
      console.log('contentType used:', contentType);

      const { data, error } = await supabase.storage
        .from('voice')
        .upload(fileName, fileBuffer, {
          contentType: contentType,
          upsert: true,
        });

      fs.unlinkSync(filePath); // حذف الملف بعد الرفع

      if (error) {
        return res.status(500).json({ error: 'فشل في رفع الصوت', details: error.message });
      }

      audioUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/voice/${fileName}`;
    }

    // إنشاء الرسالة
    const message = new Message({ sender, receiver, text, audioUrl });
    await message.save();

    // تحديث أو إنشاء المحادثة
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
};
// 🔵 جلب الرسائل بين مستخدمين
exports.getMessages = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const user1 = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: receiverId },
        { sender: receiverId, receiver: user1 },
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error('❌ Get Messages Error:', err);
    res.status(500).json({ error: 'فشل في جلب الرسائل' });
  }
};

// 🔴 حذف رسالة
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'الرسالة غير موجودة' });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'يمكنك حذف رسائلك فقط' });
    }

    await Message.findByIdAndDelete(messageId);
    res.json({ message: 'تم حذف الرسالة بنجاح' });
  } catch (err) {
    console.error('❌ Delete Message Error:', err);
    res.status(500).json({ error: 'فشل في حذف الرسالة' });
  }
};
