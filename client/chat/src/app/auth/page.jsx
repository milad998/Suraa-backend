"use client";

import Link from "next/link";
import chat_logo from "../../../public/4712035.png";

export default function AuthLandingPage() {
  return (
    <div className="container py-5" dir="rtl">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 text-center bg-white p-5 rounded shadow-lg">
          <img
            src={chat_logo}
            alt="تطبيق سرى شات"
            className="mb-4"
            style={{ maxWidth: "180px" }}
          />
          <h1 className="mb-3">مرحباً بك في <span className="text-primary">سرى شات</span></h1>
          <p className="lead text-muted mb-4">
            تطبيق دردشة بسيط وآمن، يتيح لك التواصل مع أصدقائك بسهولة، نصيًا وصوتيًا، مع الحفاظ على خصوصيتك.
          </p>

          <div className="d-grid gap-3 col-6 mx-auto">
            <Link href="/auth/login" className="btn btn-primary btn-lg">
              تسجيل الدخول
            </Link>
            <Link href="/auth/register" className="btn btn-outline-primary btn-lg">
              إنشاء حساب جديد
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
