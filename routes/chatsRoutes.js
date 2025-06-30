const express = require('express');
const { getChats, deleteChat } = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, getChats);         // ✅ جلب المحادثات
router.delete('/:id', authMiddleware, deleteChat); // 🗑 حذف محادثة

module.exports = router;
