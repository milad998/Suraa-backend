const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  const { sender, receiver, text } = req.body;
  const audioUrl = req.file ? req.file.path : null;

  const message = new Message({ sender, receiver, text, audio: audioUrl });
  await message.save();

  res.status(201).json(message);
};
