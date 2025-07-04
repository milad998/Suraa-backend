"use client";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
  autoConnect: false,
});

export default function ChatPage({ receiverId }) {
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
      setMessages((prev) => [...prev, msg]);
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
      const res = await axios.get(`http://localhost:8000/api/messages/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.error("❌ Error fetching messages:", err.message);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("receiver", receiverId);
    formData.append("text", text);

    try {
      const res = await axios.post("http://localhost:8000/api/messages", formData, {
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
      console.error("❌ Error sending message:", err.message);
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
          const res = await axios.post("http://localhost:8000/api/messages", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });

          socket.emit("sendMessage", res.data);
          setMessages((prev) => [...prev, res.data]);
        } catch (err) {
          console.error("❌ Error sending audio:", err.message);
        }

        setAudioChunks([]);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("🎙️ Error starting recording:", err);
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
    <div className="container py-4" dir="rtl">
      <h4 className="text-center mb-3">🗨️ محادثة</h4>

      <div className="border p-3 mb-2" style={{ height: "400px", overflowY: "auto" }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.sender === userId ? "text-end" : "text-start"}`}>
            <div
              className={`p-2 rounded ${
                msg.sender === userId ? "bg-primary text-white" : "bg-light"
              }`}
              style={{ display: "inline-block", maxWidth: "75%" }}
            >
              {msg.audioUrl ? (
                <audio controls src={msg.audioUrl}></audio>
              ) : (
                msg.text || "🎤 رسالة صوتية"
              )}
            </div>
          </div>
        ))}

        {typingStatus && <div className="text-muted">...يكتب الآن</div>}
        <div ref={scrollRef}></div>
      </div>

      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder="اكتب رسالتك هنا..."
          value={text}
          onChange={handleTyping}
        />
        <button className="btn btn-success" onClick={handleSend}>
          إرسال
        </button>
        <button
          className={`btn ${recording ? "btn-danger" : "btn-secondary"}`}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? "⏹️ إيقاف" : "🎙️ تسجيل"}
        </button>
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
