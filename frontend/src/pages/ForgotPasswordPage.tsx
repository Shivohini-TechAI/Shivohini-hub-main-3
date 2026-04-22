import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Enter valid email');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-reset-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true); // ✅ show success UI
      } else {
        setEmailError(data.error || "Something went wrong");
      }

    } catch (err) {
      setEmailError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">

      <div className="max-w-md w-full">
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-8">

          {/* HEADER */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-600">
              Reset Password
            </h1>
          </div>

          {!success ? (
            <form onSubmit={handleEmailVerification} className="space-y-6">

              <div>
                <label className="block text-sm mb-2">
                  <Mail className="inline mr-2 h-4 w-4" />
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  className="w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700"
                  placeholder="Enter your email"
                />

                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>

              <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

            </form>
          ) : (
            <div className="text-center text-green-500">
              ✅ Reset link sent! Check your email.
            </div>
          )}

          {/* BACK */}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-purple-600">
              <ArrowLeft className="inline mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;