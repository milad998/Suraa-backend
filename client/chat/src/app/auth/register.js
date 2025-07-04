"use client";

import { useState } from "react";
import axios from "axios";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", phone: "", password: "" });
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/api/users/register", form);
      setMessage("✅ تم التسجيل بنجاح");
    } catch (err) {
      setMessage("❌ رقم الهاتف مستخدم بالفعل");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 card p-4 shadow rounded-4">
          <h2 className="text-center mb-4">إنشاء حساب</h2>
          {message && <div className="alert alert-info">{message}</div>}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="اسم المستخدم"
              className="form-control mb-3"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
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
            <button className="btn btn-primary w-100">تسجيل</button>
          </form>
        </div>
      </div>
    </div>
  );
    }
