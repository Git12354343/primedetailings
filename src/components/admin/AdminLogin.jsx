// src/components/admin/AdminLogin.jsx
import React, { useState } from 'react';
import { Shield, LogIn, Lock, Eye, EyeOff } from 'lucide-react';

const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const ADMIN_PASSWORD = 'primeadmin2024';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('adminAuthenticated', 'true');
      onLogin();
      setLoginError('');
    } else {
      setLoginError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-800 p-3 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prime Detailing</h1>
          <p className="text-gray-600">Admin Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <LogIn className="w-6 h-6 text-gray-800 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Admin Access</h2>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{loginError}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleLogin}
              className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-900 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 font-medium"
            >
              Access Admin Dashboard
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-medium mb-2">Demo Admin Password:</p>
            <div className="text-xs text-gray-500">
              <p><strong>Password:</strong> primeadmin2024</p>
            </div>
          </div>

          {/* Back to Website */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-gray-600 hover:text-gray-700 text-sm font-medium"
            >
              ← Back to Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;