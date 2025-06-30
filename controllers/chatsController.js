const Chat = require('../models/Chat');

exports.getChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({ users: userId })
      .populate('users', 'username') // جلب اسم المستخدم للطرف الآخر
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};
