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
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const scrollRef = useRef(null);
  const notifyAudioRef = useRef(null);
  const userId = getCurrentUserId();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    if (!userId || !receiverId) return;

    socket.connect();
    socket.emit("join", userId);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;

        if (notifyAudioRef.current) {
          notifyAudioRef.current.play().catch((err) => {
            console.warn("⚠️ فشل تشغيل صوت الإشعار:", err.message);
          });
        }

        return [...prev, msg];
      });
    });

    socket.on("userTyping", (typingUserId) => {
      if (typingUserId === receiverId) setTypingStatus(true);
    });

    socket.on("userStopTyping", (typingUserId) => {
      if (typingUserId === receiverId) setTypingStatus(false);
    });

    fetchMessages();

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStopTyping");
      socket.disconnect();
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

    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit("userStopTyping", userId);
    }, 2000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        if (chunks.length === 0) {
          console.warn("⚠️ لا يوجد بيانات صوتية مسجلة.");
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

          console.log("✅ تم إرسال الصوت:", res.data);
          socket.emit("sendMessage", res.data);
          setMessages((prev) => [...prev, res.data]);
        } catch (err) {
          console.log("❌ Error sending audio:", err.message);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.log("🎙️ فشل في بدء التسجيل:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <audio ref={notifyAudioRef} src="/notify.mp3" preload="auto" />

      <div className="d-flex flex-column justify-content-between" dir="rtl" style={{ height: "100vh", background: "#f0f2f5" }}>
        <div className="d-flex flex-column flex-grow-1 overflow-auto p-2">
          {messages.map((msg, idx) => {
            const isMine = msg.sender === userId;
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let statusIcon = "";
            if (isMine) {
              if (msg.status === "read") statusIcon = "🟦✓✓";
              else if (msg.status === "delivered") statusIcon = "✓✓";
              else statusIcon = "✅";
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
                    padding: "8px 12px",
                    lineHeight: 1.2,
                  }}
                >
                  {msg.audioUrl ? (
                    <>
                      <audio controls style={{ width: "100%", borderRadius: 8 }}>
                        <source src={msg.audioUrl} type="audio/webm" />
                        المتصفح لا يدعم تشغيل هذا الملف.
                      </audio>
                      <a
                        href={msg.audioUrl}
                        download={`voice_${msg._id || idx}.webm`}
                        className="btn btn-sm btn-link mt-1"
                        style={{ textDecoration: "none", color: "#0d6efd" }}
                      >
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
          {typingStatus && <div className="text-muted mb-2">...يكتب الآن</div>}
          <div ref={scrollRef}></div>
        </div>

        <div className="p-3 bg-white border-top">
          <div className="input-group">
            <input
              type="text"
              className="form-control rounded-start-pill"
              placeholder="اكتب رسالة..."
              value={text}
              onChange={handleTyping}
            />
            <button className="btn btn-outline-primary" onClick={handleSend}>
              📤
            </button>
            <button
              className={`btn ${recording ? "btn-danger" : "btn-secondary"}`}
              onClick={recording ? stopRecording : startRecording}
            >
              {recording ? "⏹️" : "🎙️"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function getCurrentUserId() {
  try {
    const token = localStorage.getItem("token");
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  } catch {
    return null;
  }
}
