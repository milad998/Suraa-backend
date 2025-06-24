const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  const { sender, receiver, text } = req.body;
  const audioUrl = req.file ? req.file.path : null;

  const message = new Message({ sender, receiver, text, audio: audioUrl });
  await message.save();

  res.status(201).json(message);
};
exports.getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.params;

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
