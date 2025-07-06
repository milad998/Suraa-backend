'use client';

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useRouter } from "next/navigation";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://peppered-lace-newsprint.glitch.me", {
  autoConnect: false,
});

export default function ChatComponent({ params }) {
  const router = useRouter();
  const receiverId = params.receiverId;
  const userId = getCurrentUserId();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState(false);
  const [receiverOnline, setReceiverOnline] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const scrollRef = useRef(null);
  const notifyAudioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const cancelRecordingRef = useRef(false);
  const recordIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    if (!userId || !receiverId) return;

    socket.connect();
    socket.emit("join", userId);
    socket.emit("checkOnline", receiverId);

    socket.on("typing", (typingUserId) => {
      if (typingUserId === receiverId) setTypingStatus(true);
    });

    socket.on("stopTyping", (typingUserId) => {
      if (typingUserId === receiverId) setTypingStatus(false);
    });

    socket.on("onlineStatus", ({ userId: uid, online }) => {
      if (uid === receiverId) {
        setReceiverOnline(online);
      }
    });

    fetchMessages();
    markMessagesAsRead();

    return () => {
      socket.disconnect();
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("userStopTyping");
      socket.off("onlineStatus");
    };
  }, [receiverId, userId]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`https://peppered-lace-newsprint.glitch.me/api/messages/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.log("❌ Error fetching messages:", err.message);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`https://peppered-lace-newsprint.glitch.me/api/messages/mark-read/${receiverId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.sender === receiverId && msg.receiver === userId && !msg.isRead) {
            return { ...msg, isRead: true };
          }
          return msg;
        })
      );
    } catch (err) {
      console.log("❌ Error marking messages as read:", err.message);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("receiver", receiverId);
    formData.append("text", text);

    try {
      const res = await axios.post("https://peppered-lace-newsprint.glitch.me/api/messages", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      socket.emit("sendMessage", res.data);
      setMessages((prev) => [...prev, res.data]);
      setText("");
      socket.emit("userStopTyping", userId);
    } catch (err) {
      console.log("❌ Error sending message:", err.message);
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("userTyping", userId);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("userStopTyping", userId);
    }, 2000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        clearInterval(recordIntervalRef.current);
        setRecordTime(0);

        if (!chunks.length || cancelRecordingRef.current) {
          cancelRecordingRef.current = false;
          return;
        }

        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("receiver", receiverId);
        formData.append("audio", file);
        const token = localStorage.getItem("token");

        try {
          const res = await axios.post("https://peppered-lace-newsprint.glitch.me/api/messages", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });

          socket.emit("sendMessage", res.data);
          setMessages((prev) => [...prev, res.data]);
        } catch (err) {
          console.log("❌ Error sending audio:", err.message);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      recordIntervalRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.log("🎙️ Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const cancelRecording = () => {
    cancelRecordingRef.current = true;
    stopRecording();
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <audio ref={notifyAudioRef} src="/notify.mp3" preload="auto" />

      {/* ✅ Header الثابت */}
      <div className="d-flex align-items-center justify-content-between p-2 bg-white border-bottom shadow-sm"
        style={{ position: "sticky", top: 0, zIndex: 1000 }}>
        <div>
          <strong>{receiverId}</strong>
          {typingStatus && <span className="text-muted mx-2">✍️ يكتب الآن...</span>}
        </div>
        <div className={receiverOnline ? "text-success" : "text-danger"}>
          {receiverOnline ? "🟢 متصل" : "🔴 غير متصل"}
        </div>
      </div>

      {/* ✅ الرسائل */}
      <div className="d-flex flex-column justify-content-between" dir="rtl" style={{ height: "calc(100vh - 60px)", background: "#f0f2f5" }}>
        <div className="d-flex flex-column flex-grow-1 overflow-auto p-2">
          {messages.map((msg, idx) => {
            const isMine = msg.sender === userId;
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let statusIcon = "";
            if (isMine) {
              statusIcon = msg.isRead ? "✓✓" : "✓";
            }

            return (
              <div key={msg._id || idx} className={`d-flex mb-1 ${isMine ? "justify-content-end" : "justify-content-start"}`}>
                <div
                  className={`p-2 ${isMine ? "bg-info" : "bg-white"} text-dark`}
                  style={{
                    maxWidth: "75%",
                    borderRadius: "16px",
                    borderBottomLeftRadius: isMine ? "16px" : "4px",
                    borderBottomRightRadius: isMine ? "4px" : "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  {msg.audioUrl ? (
                    <>
                      <audio controls style={{ width: "100%", borderRadius: 8 }}>
                        <source src={msg.audioUrl} type="audio/webm" />
                        المتصفح لا يدعم تشغيل هذا الملف.
                      </audio>
                      <a href={msg.audioUrl} download className="btn btn-sm btn-link mt-1" style={{ textDecoration: "none", color: "#0d6efd" }}>
                        ⬇️ تحميل
                      </a>
                    </>
                  ) : (
                    <div style={{ fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{msg.text || "🎤 رسالة صوتية"}</span>
                      <small style={{ fontSize: "0.75rem", color: "#6c757d", marginLeft: "8px", whiteSpace: "nowrap" }}>
                        {time} {isMine && <span className="ms-1">{statusIcon}</span>}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef}></div>
        </div>

        {/* ✅ إدخال الرسالة */}
        <div className="p-3 bg-white border-top">
          <div className="input-group align-items-center">
            <input
              type="text"
              className="form-control rounded-start-pill"
              placeholder="اكتب رسالة..."
              value={text}
              onChange={handleTyping}
              disabled={recording}
            />
            {recording ? (
              <>
                <button className="btn btn-danger" onClick={stopRecording}>⏹️ إيقاف ({recordTime}s)</button>
                <button className="btn btn-outline-secondary" onClick={cancelRecording}>❌ إلغاء</button>
              </>
            ) : (
              <>
                <button className="btn btn-outline-primary" onClick={handleSend}>📤</button>
                <button className="btn btn-secondary" onClick={startRecording}>🎙️ تسجيل</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function getCurrentUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.id;
  } catch {
    return null;
  }
          }
