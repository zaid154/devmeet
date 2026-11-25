import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/constants';

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const stored = localStorage.getItem('adminUser');
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      
      if (!stored && !isAdminRoute) {
        setLoading(false);
        return;
      }

      if (stored) {
        setAdmin(JSON.parse(stored));
      }

      const res = await axios.get(`${BASE_URL}/admin/me`, { withCredentials: true });
      if (res.data.status && res.data.data) {
        setAdmin(res.data.data);
        localStorage.setItem('adminUser', JSON.stringify(res.data.data));
      } else {
        setAdmin(null);
        localStorage.removeItem('adminUser');
      }
    } catch (err) {
      setAdmin(null);
      localStorage.removeItem('adminUser');
    } finally {
      setLoading(false);
    }
  };

  const loginAdmin = async (email, password) => {
    const res = await axios.post(`${BASE_URL}/admin/login`, { email, password }, { withCredentials: true });
    if (res.data.status) {
      setAdmin(res.data.data);
      localStorage.setItem('adminUser', JSON.stringify(res.data.data));
      return { success: true };
    }
    return { success: false, message: res.data.message || 'Login failed' };
  };

  const logoutAdmin = async () => {
    try {
      await axios.patch(`${BASE_URL}/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.error(e);
    }
    setAdmin(null);
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
  };

  const isSuperAdmin = admin?.role === 'super-admin';
  const isAdminOrSuper = admin?.role === 'admin' || admin?.role === 'super-admin';
  const isModerator = admin?.role === 'moderator' || isAdminOrSuper;

  return (
    <AdminContext.Provider value={{
      admin,
      isAdminAuthenticated: !!admin,
      loading,
      loginAdmin,
      logoutAdmin,
      checkAdminAuth,
      isSuperAdmin,
      isAdminOrSuper,
      isModerator
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
