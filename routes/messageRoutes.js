const express = require('express');
const authMiddleware = require('../middleware/auth');
const { sendMessage, getMessages, deleteMessage } = require('../controllers/messageController');

const router = express.Router();

router.post('/', authMiddleware, sendMessage);
router.get('/:user2', authMiddleware, getMessages);
router.delete('/:id', authMiddleware, deleteMessage); // ✅ مسار حذف الرسالة

module.exports = router;
