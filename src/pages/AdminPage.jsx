// src/pages/AdminPage.jsx - Updated to use your NotificationProvider
import React, { useState, useEffect } from 'react';
import { NotificationProvider } from '../components/notifications/NotificationProvider';
import AdminLogin from '../components/admin/AdminLogin';
import AdminDashboard from '../components/admin/AdminDashboard';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuthenticated') === 'true';
    setIsAuthenticated(isAuth);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <NotificationProvider>
      {!isAuthenticated ? (
        <AdminLogin onLogin={handleLogin} />
      ) : (
        <AdminDashboard onLogout={handleLogout} />
      )}
    </NotificationProvider>
  );
};

export default AdminPage;