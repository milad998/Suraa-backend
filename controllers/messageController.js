const Message = require('../models/Message');
const Chat = require('../models/Chat'); // ✅ استيراد جدول المحادثات

// 🟢 إرسال رسالة
exports.sendMessage = async (req, res) => {
  try {
    const sender = req.user.id;
    const { receiver, text } = req.body;

    // ✅ إنشاء الرسالة
    const message = new Message({ sender, receiver, text });
    await message.save();

    // ✅ تحديث أو إنشاء محادثة في جدول chats
    let chat = await Chat.findOne({ users: { $all: [sender, receiver] } });

    if (!chat) {
      chat = new Chat({
        users: [sender, receiver],
        lastMessage: text,
        updatedAt: new Date(),
      });
    } else {
      chat.lastMessage = text;
      chat.updatedAt = new Date();
    }

    await chat.save();

    res.status(201).json(message);
  } catch (err) {
    console.error('❌ Send Message Error:', err);
    res.status(500).json({
      error: 'Failed to send message',
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


