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

---

🔌 أحداث Socket المدعومة

اسم الحدث	البيانات المطلوبة	الوصف

join	{ userId }	ينضم المستخدم لغرفة خاصة
sendMessage	{ sender, receiver, text }	إرسال وحفظ الرسالة
receiveMessage	{ sender, receiver, text, _id, createdAt }	استقبال الرسالة من الطرف الآخر
deleteMessage	{ messageId, receiverId }	حذف الرسالة وإعلام الطرف الآخر
messageDeleted	{ messageId }	إعلام الطرف الآخر أنه تم حذف الرسالة



---

📄 الترخيص

هذا المشروع مفتوح المصدر ومتاح تحت رخصة MIT.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
---

👤 المطوّر

ميلاد شيخ ناصر
بريد إلكتروني: [milad.nasir2023@gmail.com]
GitHub: github.com/milad998




