const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const Message = require('../models/Message');
const Chat = require('../models/Chats');

// ✅ إعداد Supabase من .env
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

    // ✅ رفع الصوت إلى Supabase إن وُجد ملف صوتي
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

      fs.unlinkSync(filePath); // حذف الملف من السيرفر بعد الرفع

      if (error) {
        return res.status(500).json({ error: 'فشل في رفع الصوت', details: error.message });
      }

      audioUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${data.path}`;
    }

    // ✅ إنشاء الرسالة
    const message = new Message({ sender, receiver, text, audioUrl });
    await message.save();

    // ✅ تحديث أو إنشاء المحادثة
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
