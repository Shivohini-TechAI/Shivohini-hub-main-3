import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ FIX: use React Router hook
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const handleReset = async () => {
    setError("");

    console.log("🔐 TOKEN FROM URL:", token); // 👈 DEBUG

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          newPassword: password
        })
      });

      const data = await res.json();

      console.log("🔁 RESPONSE:", data);

      if (res.ok && data.success) {
        alert("Password reset successful!");
        navigate("/login");
      } else {
        setError(data.error || "Something went wrong");
      }

    } catch (err) {
      console.error(err);
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow">

        <h2 className="text-xl font-bold text-center mb-4">
          Reset Password
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
        )}

        <input
          type="password"
          placeholder="Enter new password"
          className="w-full border p-3 mb-4 rounded"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

      </div>
    </div>
  );
};

export default ResetPasswordPage;