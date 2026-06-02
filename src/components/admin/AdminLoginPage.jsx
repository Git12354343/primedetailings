// src/pages/AdminLogin.jsx
// This file is superseded by src/components/admin/AdminLogin.jsx which uses
// real server-side authentication. This shim redirects to /admin so any old
// bookmarks or direct links still work.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/admin', { replace: true }); }, [navigate]);
  return null;
};

export default AdminLoginPage;
