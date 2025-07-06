"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function SearchContacts() {
  const [phones, setPhones] = useState("");
  const [results, setResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const handleSearch = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }
      const res = await axios.post(
        "process.env.NEXT_PUBLIC_BACKEND/api/users/search-contacts",
        { phones: phones.split(",").map((p) => p.trim()) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(res.data);
    } catch (err) {
      alert("فشل في البحث عن جهات الاتصال");
    }
  };

  const handleSelectUser = (receiverId) => {
    // ✅ التوجيه إلى صفحة الرسائل باستخدام receiverId
    router.push(`/message/${receiverId}`);
  };

  return (
    <div className="container py-5">
      <h3 className="mb-3">البحث عن الأصدقاء عبر أرقام الهواتف</h3>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="أدخل الأرقام مفصولة بفاصلة ,"
          value={phones}
          onChange={(e) => setPhones(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSearch}>
          بحث
        </button>
      </div>

      {results.length > 0 && (
        <ul className="list-group">
          {results.map((user) => (
            <li
              key={user._id}
              className="list-group-item list-group-item-action"
              onClick={() => handleSelectUser(user._id)} // ✅ هنا نمرر receiverId
              style={{ cursor: "pointer" }}
            >
              {user.username} - {user.phone}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
