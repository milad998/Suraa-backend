const Message = require('../models/Message');


exports.sendMessage = async (req, res) => {
  try {
    const sender = req.user.id; // أو req.user._id حسب التوكن
    const { receiver, text } = req.body;
    const audioUrl = req.file ? req.file.path : null;

    const message = new Message({ sender, receiver, text, audio: audioUrl });
    await message.save();
    
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};
exports.getMessages = async (req, res) => {
  try {
    const { user2 } = req.params;
    const user1 = req.user.id
    
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
