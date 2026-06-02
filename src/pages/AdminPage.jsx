// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { NotificationProvider } from '../components/notifications/NotificationProvider';
import AdminLogin     from '../components/admin/AdminLogin';
import AdminDashboard from '../components/admin/AdminDashboard';

const AdminPage = () => {
  const [adminToken, setAdminToken] = useState(null);

  // Restore token from sessionStorage on mount (survives page reload, not tab close)
  useEffect(() => {
    const stored = sessionStorage.getItem('adminToken');
    if (stored) setAdminToken(stored);
  }, []);

  const handleLogin = (token) => {
    setAdminToken(token);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    setAdminToken(null);
  };

  return (
    <NotificationProvider>
      {!adminToken ? (
        <AdminLogin onLogin={handleLogin} />
      ) : (
        <AdminDashboard adminToken={adminToken} onLogout={handleLogout} />
      )}
    </NotificationProvider>
  );
};

export default AdminPage;
