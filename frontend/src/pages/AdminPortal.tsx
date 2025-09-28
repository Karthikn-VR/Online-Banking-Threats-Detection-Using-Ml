import React, { useState } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminDashboard from '@/components/admin/AdminDashboard';

const AdminPortal: React.FC = () => {
  const [adminToken, setAdminToken] = useState<string | null>(
    localStorage.getItem('admin_token')
  );

  const handleLogin = (token: string) => {
    localStorage.setItem('admin_token', token);
    setAdminToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAdminToken(null);
  };

  if (!adminToken) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
};

export default AdminPortal;