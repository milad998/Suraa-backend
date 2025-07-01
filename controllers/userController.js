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
exports.loginUser = async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, id: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

const User = require('../models/User');

exports.searchContacts = async (req, res) => {
  const { phones } = req.body; // مصفوفة أرقام الهواتف

  try {
    const users = await User.find({ phone: { $in: phones } }, '_id username phone');
    res.json(users); // ✅ يرجع فقط المسجلين
  } catch (err) {
    console.error('❌ Search Contacts Error:', err);
    res.status(500).json({ error: 'Failed to search contacts' });
  }
};
