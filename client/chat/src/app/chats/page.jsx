"use client"
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

// socket خارج المكون لضمان عدم إنشاء اتصال جديد في كل رندر
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
  autoConnect: false,
});

export default function ChatsPage() {
  const [chats, setChats] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const userId = getCurrentUserId();

  useEffect(() => {
    if (!userId) return;

    socket.connect(); // الاتصال فقط عند وجود userId
    socket.emit("join", userId);

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    fetchChats();

    return () => {
      socket.off("onlineUsers"); // إيقاف الاستماع
      socket.disconnect();
    };
  }, [userId]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8000/api/chats/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(res.data);
    } catch (err) {
      console.log("❌ Error fetching chats:", err.message);
    }
  };

  const isUserOnline = (id) => onlineUsers.includes(id);

  return (
    <div className="container py-5" dir="rtl">
      <h2 className="mb-4 text-center">📱 قائمة المحادثات</h2>

      {chats.map((chat) => {
        const otherUser = chat.users.find((u) => u._id !== userId);
        return (
          <div
            key={chat._id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{otherUser?.username || "مستخدم"}</strong>
              <br />
              <small className="text-muted">{chat.lastMessage || "بدون رسائل"}</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              {/* ✅ نقطة الحالة */}
              <span
                className="rounded-circle"
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: isUserOnline(otherUser._id) ? "limegreen" : "#ccc",
                }}
              ></span>
              <button className="btn btn-sm btn-danger">حذف</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ✅ فك الـ JWT للحصول على userId
function getCurrentUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  } catch {
    return null;
  }
              }
