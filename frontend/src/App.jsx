import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Feed from './pages/Feed';
import Connections from './pages/Connections';
import Profile from './pages/Profile';
import ProfileDetails from './pages/ProfileDetails';
import EditProfile from './pages/EditProfile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import Explore from './pages/Explore';
import Chat from './pages/Chat';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import MobileBottomNav from './components/MobileBottomNav';

// Admin imports
import { AdminProvider, useAdmin } from './admin/context/AdminContext';
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminUsers from './admin/pages/AdminUsers';
import AdminReports from './admin/pages/AdminReports';
import AdminVerifications from './admin/pages/AdminVerifications';
import AdminModeration from './admin/pages/AdminModeration';
import AdminMediaCMS from './admin/pages/AdminMediaCMS';
import AdminAnnouncements from './admin/pages/AdminAnnouncements';
import AdminFeatures from './admin/pages/AdminFeatures';
import AdminTeam from './admin/pages/AdminTeam';
import AdminActivityLogs from './admin/pages/AdminActivityLogs';
import AdminSettings from './admin/pages/AdminSettings';

import PageLoader from './components/PageLoader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <PageLoader text="Loading your feed..." />;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated, loading } = useAdmin();
  if (loading) {
    return <PageLoader text="Verifying Admin Access..." />;
  }
  return isAdminAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isFullscreenApp = ['/feed', '/app/recs', '/app/explore', '/explore', '/search', '/chat', '/messages'].includes(location.pathname);

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
        <Route path="/admin/reports" element={<AdminProtectedRoute><AdminReports /></AdminProtectedRoute>} />
        <Route path="/admin/verifications" element={<AdminProtectedRoute><AdminVerifications /></AdminProtectedRoute>} />
        <Route path="/admin/moderation" element={<AdminProtectedRoute><AdminModeration /></AdminProtectedRoute>} />
        <Route path="/admin/media" element={<AdminProtectedRoute><AdminMediaCMS /></AdminProtectedRoute>} />
        <Route path="/admin/announcements" element={<AdminProtectedRoute><AdminAnnouncements /></AdminProtectedRoute>} />
        <Route path="/admin/features" element={<AdminProtectedRoute><AdminFeatures /></AdminProtectedRoute>} />
        <Route path="/admin/team" element={<AdminProtectedRoute><AdminTeam /></AdminProtectedRoute>} />
        <Route path="/admin/activity-logs" element={<AdminProtectedRoute><AdminActivityLogs /></AdminProtectedRoute>} />
        <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  return (
    <div className={`${isFullscreenApp ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col justify-between font-sans relative`} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
      <Header />
      
      <main className={`flex-1 flex flex-col ${isFullscreenApp ? 'h-full overflow-hidden' : ''}`}>
        <Routes>
          {/* Public Landing / Marketing */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Home />} />
          
          {/* Core Dating Routes (Strict Protected - Login Mandatory) */}
          <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/app/recs" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/app/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/connections" element={<Navigate to="/feed" replace />} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/notifications" element={<Navigate to="/feed" replace />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><ProfileDetails /></ProtectedRoute>} />
          <Route path="/settings" element={<Navigate to="/feed?open=settings" replace />} />
          
          {/* Auth Modals & Full Onboarding Pages */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/feed" replace /> : <><Home /><Login initialMode="login" /></>} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/feed" replace /> : <><Home /><Login initialMode="signup" /></>} />
          <Route path="/app/onboarding" element={<Onboarding />} />
          <Route path="/forgot-password" element={<><Home /><ForgotPassword /></>} />
          <Route path="/reset-password" element={<><Home /><ResetPassword /></>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AdminProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </AdminProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
