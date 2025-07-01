const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // الرسالة النصية (اختياري)
  text: {
    type: String,
    default: null,
  },

  // رابط الملف الصوتي (اختياري)
  audioUrl: {
    type: String,
    default: null,
  },

  // هل تم قراءة الرسالة
  isRead: {
    type: Boolean,
    default: false,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', messageSchema);
