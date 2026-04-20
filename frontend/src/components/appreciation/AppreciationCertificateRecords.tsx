import React, { useEffect, useState } from "react";
import api from "../../lib/api";

// ✅ DEFINE TYPE
interface Certificate {
  id: string;
  recipient_name: string;
  designation: string;
  appreciation_for: string;
  issue_date: string;
  joining_date: string;
}

const AppreciationCertificateRecords = () => {
  const [data, setData] = useState<Certificate[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      // ✅ TYPE FIX HERE
      const res = await api.get<Certificate[]>("/api/appreciation-certificates", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("📊 CERT DATA:", res.data);

      setData(res.data);

    } catch (err) {
      console.error("FETCH ERROR:", err);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      {data.length === 0 ? (
        <p className="text-gray-500 text-center">No certificates found</p>
      ) : (
        data.map((c) => (
          <div key={c.id} className="border-b py-3">
            <p className="font-semibold">{c.recipient_name}</p>
            <p className="text-sm text-gray-500">{c.designation}</p>
            <p className="text-sm">{c.appreciation_for}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default AppreciationCertificateRecords;