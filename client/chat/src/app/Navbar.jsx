"use client";
import { useEffect } from "react";
import chat_logo from "../../public/4712035.png";
import Image from "next/image";

export default function Navbar() {
  useEffect(() => {
    // تفعيل عناصر Bootstrap (لـ collapse)
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light" dir="rtl">
      <div className="container">
        {/* الشعار */}
        <Image
            src={chat_logo}
            alt="Chat Illustration"
            width={50}
            height={50}
            className="mb-4"
            priority
          />

        {/* زر القائمة للجوال */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="تبديل التنقل"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* الروابط */}
        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link active" href="/">
                الرئيسية
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/chats">
                الدردشات
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/contacts">
                الاصدقاء
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
              }
