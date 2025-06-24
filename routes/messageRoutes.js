const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

const { sendMessage, getMessages } = require('../controllers/messageController');

const router = express.Router();

router.post('/', upload.single('audio'), sendMessage);
router.get('/:user1/:user2', getMessages);

module.exports = router;
