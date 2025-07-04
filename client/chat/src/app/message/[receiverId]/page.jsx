'use client';

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
  autoConnect: false,
});

export default function ChatComponent({ params }) {
  const receiverId = params.receiverId;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const scrollRef = useRef(null);
  const userId = getCurrentUserId();

  useEffect(() => {
    if (!userId || !receiverId) return;

    socket.connect();
    socket.emit("join", userId);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
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
  }, [receiverId]);

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
      const recorder = new MediaRecorder(stream);
      setAudioChunks([]);

      recorder.ondataavailable = (e) => {
        setAudioChunks((prev) => [...prev, e.data]);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
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

        setAudioChunks([]);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.log("🎙️ Error starting recording:", err);
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
    <div className="d-flex flex-column justify-content-between" dir="rtl" style={{ height: "100vh", background: "#e5ddd5" }}>
      <div className="p-3 text-center bg-success text-white shadow">🗨️ محادثة</div>

      <div className="flex-grow-1 p-3 overflow-auto">
        {messages.map((msg, idx) => {
          const isMine = msg.sender === userId;
          const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          let statusIcon = "";
          if (isMine) {
            if (msg.status === "read") statusIcon = "🟦✓✓";
            else if (msg.status === "delivered") statusIcon = "✓✓";
            else statusIcon = "✅";
          }

          return (
            <div key={msg._id || idx} className={`d-flex mb-2 ${isMine ? "justify-content-end" : "justify-content-start"}`}>
              <div
                className={`p-2 shadow-sm ${isMine ? "bg-success text-white" : "bg-white text-dark"}`}
                style={{
                  maxWidth: "75%",
                  borderRadius: "16px",
                  borderBottomLeftRadius: isMine ? "16px" : "4px",
                  borderBottomRightRadius: isMine ? "4px" : "16px",
                  position: "relative",
                }}
              >
                {msg.audioUrl ? (
                  <audio controls src={msg.audioUrl}></audio>
                ) : (
                  <div>{msg.text || "🎤 رسالة صوتية"}</div>
                )}
                <div
                  className="text-end text-white-50 small mt-1"
                  style={{ fontSize: "0.75rem", opacity: 0.8 }}
                >
                  {time} {isMine && <span className="ms-1">{statusIcon}</span>}
                </div>
              </div>
            </div>
          );
        })}

        {typingStatus && <div className="text-muted mb-2">...يكتب الآن</div>}
        <div ref={scrollRef}></div>
      </div>

      <div className="p-2 bg-white border-top">
        <div className="input-group">
          <input
            type="text"
            className="form-control rounded-start-pill"
            placeholder="اكتب رسالة..."
            value={text}
            onChange={handleTyping}
            style={{ borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }}
          />
          <button className="btn btn-outline-success" onClick={handleSend}>
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
