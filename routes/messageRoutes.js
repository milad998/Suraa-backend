const express = require('express');
const authMiddleware = require('../middleware/auth');
const { sendMessage, getMessages } = require('../controllers/messageController');

const router = express.Router();

router.post('/', authMiddleware, sendMessage);
router.get('/:user2', authMiddleware, getMessages);

module.exports = router;
