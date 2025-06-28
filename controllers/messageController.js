const Message = require('../models/Message');


exports.sendMessage = async (req, res) => {
exports.sendMessage = async (req, res) => {
  try {
    // 👇 هذا يطبع الكائنات بشكل قابل للقراءة
    console.log('✅ req.body:', JSON.stringify(req.body, null, 2));
    console.log('✅ req.file:', JSON.stringify(req.file, null, 2));

    const sender = req.user.id;
    const { receiver, text } = req.body;
    const audioUrl = req.file ? req.file.path : null;

    const message = new Message({ sender, receiver, text, audio: audioUrl });
    await message.save();

    res.status(201).json(message);
  } catch (err) {
    console.error('❌ Send Message Error:', err);
    res.status(500).json({
      error: 'Failed to send message',
      message: err.message,
      stack: err.stack
    });
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
