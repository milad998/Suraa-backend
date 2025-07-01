const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require("dotenv").config();

exports.createUser = async (req, res) => {
  const { username, phone, password } = req.body;

  try {
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ error: 'Phone already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, phone, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User created', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
};


exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token, id: user._id });
};
