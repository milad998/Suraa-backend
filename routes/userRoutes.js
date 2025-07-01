const express = require('express');
const { createUser, loginUser, searchContacts } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', createUser);
router.post('/login', loginUser);
router.post('/search-contacts', authMiddleware, searchContacts); // ✅ جديد

module.exports = router;
