const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('./firebase-adminsdk.json'); // ضع الملف الذي حمّلته من Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'your-project-id.appspot.com', // استبدل بـ ID الخاص بك
});

const bucket = admin.storage().bucket();

module.exports = bucket;
