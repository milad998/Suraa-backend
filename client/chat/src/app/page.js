"use client";

import Image from "next/image";
import Link from "next/link";
import chat_logo from "../../public/4712035.png";

export default function Home() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 text-center bg-white p-5 rounded shadow">
          <Image
            src={chat_logo}
            alt="Chat Illustration"
            width={200}
            height={200}
            className="mb-4"
            priority
          />
          <h1 className="display-5 fw-bold mb-3">مرحباً بك في سرى شات</h1>
          <p className="lead mb-4">
            سرى شات هو تطبيق دردشة آمن وسريع وسهل الاستخدام. تواصل مع من تحب دون قيود وبخصوصية تامة.
          </p>
          <Link href="/auth" className="btn btn-primary btn-lg px-4">
            ابدأ الآن
          </Link>
        </div>
      </div>

      <footer className="text-center mt-5 text-muted small">
        © 2025 سرى شات - جميع الحقوق محفوظة
      </footer>
    </div>
  );
              }
