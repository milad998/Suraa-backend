const Chat = require('../models/Chat');
const Message = require('../models/Message');

exports.getChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({ users: userId })
      .populate('users', 'username') // إحضار أسماء المستخدمين
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    console.error('❌ Get Chats Error:', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // تأكد أن المستخدم من ضمن المشاركين
    if (!chat.users.includes(userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // حذف الرسائل المرتبطة بهذه المحادثة
    await Message.deleteMany({
      $or: [
        { sender: chat.users[0], receiver: chat.users[1] },
        { sender: chat.users[1], receiver: chat.users[0] },
      ]
    });

    await Chat.findByIdAndDelete(chatId);

    res.json({ message: 'Chat and messages deleted successfully' });
  } catch (err) {
    console.error('❌ Delete Chat Error:', err);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};
