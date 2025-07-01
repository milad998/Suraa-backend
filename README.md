# Suraa-backend
# 💬 مشروع دردشة فورية (الجزء الخلفي)

هذا المشروع يمثل الجزء الخلفي (Back-End) لتطبيق دردشة فورية باستخدام **Node.js** و**Express** و**Socket.IO** و**MongoDB**. يوفّر واجهات برمجية (APIs) آمنة لإدارة المستخدمين والرسائل والمحادثات، بالإضافة إلى دعم التواصل اللحظي (real-time) باستخدام WebSocket.

---

## 🚀 الميزات

- ✅ إرسال واستقبال الرسائل في الوقت الفعلي باستخدام Socket.IO
- ✅ غرف دردشة خاصة (من مستخدم إلى مستخدم)
- ✅ REST API لإدارة المستخدمين والرسائل والمحادثات
- ✅ الاتصال بقاعدة بيانات MongoDB باستخدام Mongoose
- ✅ الحماية من هجمات XSS و NoSQL Injection
- ✅ تقييد عدد الطلبات لحماية الخادم
- ✅ إعدادات أمان متقدمة باستخدام Helmet
- ✅ دعم CORS للاتصال بين السيرفر والتطبيق الأمامي

---

## 🛠️ التقنيات المستخدمة

- Node.js
- Express
- Socket.IO
- MongoDB + Mongoose
- dotenv
- helmet + xss-clean + express-mongo-sanitize
- express-rate-limit

---

## 📁 هيكل المجلدات
project/ 
├── middleware
│   └── auth.js
├── models/ 
│   └── Message.js 
│   └── User.js
│   └── Chats.js
├── controllers
│   └── userController.js
│   └── chatsController.js
│   └── messageController.js
├── routes/
│   ├── chatsRoutes.js
│   ├── userRoutes.js 
│   └── messageRoutes.js 
├── .env 
├── index.js
└── package.json
---

## ⚙️ خطوات التشغيل

1. **نسخ المشروع**
   ```bash
   git clone https://github.com/milad998/Suraa-backend.git

## 🔨 تثبيت المكاتب

npm install

## 📍 تشغيل

npm start
