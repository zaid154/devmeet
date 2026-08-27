import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './pages/Login';
import PageLoader from './components/PageLoader';
import MobileBottomNav from './components/MobileBottomNav';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminProvider, useAdmin } from './admin/context/AdminContext';
import CallOverlay from './components/CallOverlay';

// Dynamic Lazy Route Imports for Ultra-Fast Initial Bundle Load
const Feed = lazy(() => import('./pages/Feed'));
const Explore = lazy(() => import('./pages/Explore'));
const Search = lazy(() => import('./pages/Search'));
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
const ProfileDetails = lazy(() => import('./pages/ProfileDetails'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Lazy Admin Components
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
const AdminUsers = lazy(() => import('./admin/pages/AdminUsers'));
const AdminReports = lazy(() => import('./admin/pages/AdminReports'));
const AdminVerifications = lazy(() => import('./admin/pages/AdminVerifications'));
const AdminModeration = lazy(() => import('./admin/pages/AdminModeration'));
const AdminMediaCMS = lazy(() => import('./admin/pages/AdminMediaCMS'));
const AdminAnnouncements = lazy(() => import('./admin/pages/AdminAnnouncements'));
const AdminFeatures = lazy(() => import('./admin/pages/AdminFeatures'));
const AdminTeam = lazy(() => import('./admin/pages/AdminTeam'));
const AdminActivityLogs = lazy(() => import('./admin/pages/AdminActivityLogs'));
const AdminSettings = lazy(() => import('./admin/pages/AdminSettings'));

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
  const { isAuthenticated, user } = useAuth();
  const { callState, setCallState, acceptCall, declineCall, endCall, socket } = useSocket();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isFullscreenApp = ['/feed', '/app/recs', '/app/explore', '/explore', '/search', '/chat', '/messages'].includes(location.pathname);

  if (isAdminRoute) {
    return (
      <Suspense fallback={<PageLoader text="Loading Admin Module..." />}>
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
          <Route path="/admin/logs" element={<AdminProtectedRoute><AdminActivityLogs /></AdminProtectedRoute>} />
          <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className={`${isFullscreenApp ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col justify-between font-sans relative`} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
      <Header />
      
      <main className={`flex-1 flex flex-col ${isFullscreenApp ? 'h-full overflow-hidden' : ''}`}>
        <Suspense fallback={<PageLoader text="Loading..." />}>
          <Routes>
            {/* Public Landing / Marketing */}
            <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Home />} />
            
            {/* Core Dating Routes (Strict Protected - Login Mandatory) */}
            <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/app/recs" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/app/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
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
        </Suspense>
      </main>

      <Footer />
      <MobileBottomNav />

      {/* Global Real-Time Call Overlay (Voice & Video) */}
      <CallOverlay
        callState={callState}
        socket={socket}
        callerInfo={user}
        onEndCall={endCall}
        onAcceptCall={acceptCall}
        onDeclineCall={declineCall}
      />
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
