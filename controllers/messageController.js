const Message = require('../models/Message');
const uploadToFirebase = require('../utils/uploadToFirebase');

exports.sendMessage = async (req, res) => {
  try {
    const sender = req.user.id;
    const { receiver, text } = req.body;

    let audioUrl = null;

    if (req.file) {
      audioUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const message = new Message({ sender, receiver, text, audio: audioUrl });
    await message.save();

    res.status(201).json(message);
  } catch (err) {
    console.error('❌ Send Message Error:', err);
    res.status(500).json({
      error: 'Failed to send message',
      message: err.message,
    });
  }
};

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
