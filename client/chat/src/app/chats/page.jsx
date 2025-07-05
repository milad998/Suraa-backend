"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useRouter } from "next/navigation";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
  autoConnect: false,
});

export default function ChatsPage() {
  const [chats, setChats] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const router = useRouter();
  const userId = getCurrentUserId();

  // تحقق من وجود التوكن وإعادة التوجيه إن لم يكن موجود
  useEffect(() => {
    if (!userId) {
      router.replace("/auth/login"); // توجه لصفحة تسجيل الدخول ولا تسمح بالرجوع
      return;
    }
  }, [userId, router]);

  useEffect(() => {
    if (!userId) return;

    socket.connect();
    socket.emit("join", userId);

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    fetchChats();

    return () => {
      socket.off("onlineUsers");
      socket.disconnect();
    };
  }, [userId]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://peppered-lace-newsprint.glitch.me/api/chats/", {
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
      {chats.map((chat) => {
        const otherUser = chat.users.find((u) => u._id !== userId);
        return (
          <div
            key={chat._id}
            onClick={() => router.push(`/message/${otherUser._id}`)}
            className="list-group-item d-flex justify-content-between align-items-center"
            style={{ cursor: "pointer" }}
          >
            <div className= "background-silver-transparent p-3">
              <strong>{otherUser?.username || "مستخدم"}</strong>
              <br />
              <small className="text-muted">{chat.lastMessage || "بدون رسائل"}</small>
            </div>
            <div className="d-flex align-items-center gap-2">
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

// فك التوكن للحصول على معرف المستخدم الحالي
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

