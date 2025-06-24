const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const authMiddleware = require('../middleware/auth');

const { sendMessage, getMessages } = require('../controllers/messageController');

const router = express.Router();

router.post('/',authMiddleware, upload.single('audio'), sendMessage);
router.get('/:user2',authMiddleware, getMessages);

module.exports = router;
