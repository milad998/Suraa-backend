"use client";

import { useState } from "react";
import axios from "axios";

export default function LoginPage() {
  const [form, setForm] = useState({ phone: "", password: "" });
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("process.env.NEXT_PUBLIC_BACKEND/api/users/login", form);
      localStorage.setItem("token", res.data.token);
      setMessage("✅ تسجيل الدخول ناجح");
    } catch (err) {
      setMessage("❌ رقم الهاتف أو كلمة المرور غير صحيحة");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 card p-4 shadow rounded-4">
          <h2 className="text-center mb-4">تسجيل الدخول</h2>
          {message && <div className="alert alert-info">{message}</div>}

          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="رقم الهاتف"
              className="form-control mb-3"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              className="form-control mb-3"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button className="btn btn-success w-100">تسجيل الدخول</button>
          </form>
        </div>
      </div>
    </div>
  );
              }
