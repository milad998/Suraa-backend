const express = require('express');
const { getChats } = require('../controllers/chatsController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.get('/', authMiddleware, getChats);

module.exports = router;
