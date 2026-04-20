import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [strongAreas, setStrongAreas] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'team_member' | 'team_leader' | 'project_manager' | 'admin' | null>(null);
  const [roleCodeError, setRoleCodeError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  // ✅ VALIDATE ROLE CODE
  const validateRoleCode = async (code: string) => {
    if (!code.trim()) {
      setRoleCodeError('Role code is required');
      setSelectedRole(null);
      return;
    }

    setValidatingCode(true);
    setRoleCodeError('');

    try {
      const response = await fetch(`http://localhost:5000/functions/v1/validate-role-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (data.valid && data.role) {
        setSelectedRole(data.role);
        setRoleCodeError('');
      } else {
        setRoleCodeError(data.error || 'Invalid role code');
        setSelectedRole(null);
      }
    } catch {
      setRoleCodeError('Server error');
      setSelectedRole(null);
    } finally {
      setValidatingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError('Please enter a valid role code');
      return;
    }

    const whatsappNumber = sameAsPhone ? phone : whatsapp;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const success = await signup({
        name,
        email,
        password,
        phone,
        whatsapp: whatsappNumber,
        strongAreas,
        role: selectedRole,
      });

      if (success) {
        navigate('/dashboard');
      } else {
        setError('Signup failed');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSameAsPhoneChange = (checked: boolean) => {
    setSameAsPhone(checked);
    if (checked) setWhatsapp(phone);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (sameAsPhone) setWhatsapp(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 dark:border-gray-700/50">

          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
              <img
                src="/Logo_withoutBG.png"
                alt="Company Logo"
                style={{ height: "80px", width: "auto" }}
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Shivohini-Hub</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">A central hub for all your team's projects and activities</p>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsPhone}
                  onChange={(e) => handleSameAsPhoneChange(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <span>WhatsApp same as phone</span>
              </label>

              {!sameAsPhone && (
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Enter your WhatsApp number"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              )}
            </div>

            {/* Role Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Code
              </label>
              <input
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value.toUpperCase())}
                onBlur={() => validateRoleCode(roleCode)}
                placeholder="Enter your role code"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  roleCodeError
                    ? 'border-red-500 dark:border-red-500'
                    : selectedRole
                    ? 'border-green-500 dark:border-green-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />

              {roleCodeError && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {roleCodeError}
                </p>
              )}

              {selectedRole && (
                <p className="text-green-600 dark:text-green-400 text-sm mt-1 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> {selectedRole}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-medium focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                Login
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SignupPage;