import React, { useEffect, useState } from "react";

const API = "http://localhost:5000";

const LostClientsAnalytics: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const token = localStorage.getItem("token");

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`${API}/clients/analytics/lost`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await res.json();
      setData(result);

    } catch (err) {
      console.error("❌ ANALYTICS ERROR:", err);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Lost Clients Analytics</h1>

      {data.length === 0 ? (
        <p>No data available</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, index) => (
            <div key={index} className="bg-white p-4 shadow rounded">
              <h3 className="font-semibold">{item.current_stage}</h3>
              <p className="text-xl">{item.count} clients lost</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default LostClientsAnalytics;