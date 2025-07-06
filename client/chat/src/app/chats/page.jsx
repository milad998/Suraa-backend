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
  const [unreadCounts, setUnreadCounts] = useState({});
  const router = useRouter();
  const userId = getCurrentUserId();

  useEffect(() => {
    if (!userId) {
      router.replace("/auth/login");
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

    socket.on("receiveMessage", (msg) => {
      const otherId = msg.sender === userId ? msg.receiver : msg.sender;

      // ✅ تشغيل صوت الإشعار فقط إذا لم تكن داخل نفس صفحة الرسائل المفتوحة
      if (window.location.pathname !== `/message/${otherId}`) {
        const audio = document.getElementById("notify-audio");
        if (audio) {
          audio.play().catch((err) =>
            console.warn("فشل تشغيل صوت الإشعار:", err.message)
          );
        }

        // ✅ تحديث عداد الرسائل غير المقروءة
        setUnreadCounts((prev) => ({
          ...prev,
          [otherId]: (prev[otherId] || 0) + 1,
        }));
      }

      // ✅ تحديث آخر رسالة في المحادثة
      setChats((prev) =>
        prev.map((chat) =>
          chat.users.some((u) => u._id === otherId)
            ? { ...chat, lastMessage: msg.text || "📩 رسالة جديدة" }
            : chat
        )
      );
    });

    fetchChats();

    return () => {
      socket.off("onlineUsers");
      socket.off("receiveMessage");
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

  const handleOpenChat = (otherUserId) => {
    router.push(`/message/${otherUserId}`);
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[otherUserId];
      return updated;
    });
  };

  return (
    <div className="container py-5" dir="rtl">
      <audio id="notify-audio" src="/notify.mp3" preload="auto" />

      {chats.map((chat) => {
        const otherUser = chat.users.find((u) => u._id !== userId);
        if (!otherUser) return null;

        return (
          <div
            key={chat._id}
            onClick={() => handleOpenChat(otherUser._id)}
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center shadow-sm mb-2"
            style={{
              borderRadius: "12px",
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              cursor: "pointer",
            }}
          >
            <div>
              <strong>{otherUser?.username || "مستخدم"}</strong>
              <br />
              <small className="text-muted">{chat.lastMessage || "بدون رسائل"}</small>
            </div>

            <div className="d-flex align-items-center gap-2">
              {unreadCounts[otherUser._id] > 0 && (
                <span className="badge bg-danger rounded-pill">
                  {unreadCounts[otherUser._id]}
                </span>
              )}
              <span
                className="rounded-circle"
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: isUserOnline(otherUser._id) ? "limegreen" : "#ccc",
                }}
              ></span>
              {/* <button className="btn btn-sm btn-danger">حذف</button> */}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
