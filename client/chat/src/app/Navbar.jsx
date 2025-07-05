"use client";
import { useEffect } from "react";

export default function Navbar() {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <nav className="navbar navbar-light bg-light sticky-top" dir="rtl">
      <div className="container d-flex justify-content-center align-items-center">
        {/* الأيقونات فقط */}
        <div className="d-flex gap-4">
          <a href="/" className="text-dark fs-4" aria-label="الرئيسية">
            <i className="bi bi-house"></i>
          </a>
          <a href="/chats" className="text-dark fs-4" aria-label="الدردشات">
            <i className="bi bi-chat-dots"></i>
          </a>
          <a href="/contacts" className="text-dark fs-4" aria-label="الأصدقاء">
            <i className="bi bi-people"></i>
          </a>
        </div>
      </div>
    </nav>
  );
}
