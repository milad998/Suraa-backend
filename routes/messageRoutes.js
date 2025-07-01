const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const { sendMessage, getMessages, deleteMessage } = require('../controllers/messageController');

const router = express.Router();

// إعداد multer
const upload = multer({ dest: 'uploads/' });

// 🟢 إرسال رسالة (نص أو صوت)
router.post('/', authMiddleware, upload.single('audio'), sendMessage);

// 🔵 جلب الرسائل بين مستخدمين
router.get('/:user2', authMiddleware, getMessages);

// 🔴 حذف رسالة
router.delete('/:id', authMiddleware, deleteMessage);

module.exports = router;
