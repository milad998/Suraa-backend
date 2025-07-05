"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function SearchContacts() {
  const [phones, setPhones] = useState("");
  const [results, setResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/login");
    }
  }, [router]);

  const handleSearch = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/auth/login");
        return;
      }
      const res = await axios.post(
        "https://peppered-lace-newsprint.glitch.me/api/users/search-contacts",
        { phones: phones.split(",").map((p) => p.trim()) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(res.data);
    } catch (err) {
      alert("فشل في البحث عن جهات الاتصال");
    }
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
            <li className="list-group-item" key={user._id}>
              {user.username} - {user.phone}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
