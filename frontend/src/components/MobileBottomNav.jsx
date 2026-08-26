import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { unreadNotifications } = useSocket();

  // Only show for authenticated in-app users on mobile/tablet views
  if (!isAuthenticated || location.pathname === '/' || location.pathname.startsWith('/admin') || location.pathname === '/app/onboarding' || location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  const currentPath = location.pathname;

  const isSwipeActive = currentPath === '/feed' || currentPath === '/app/recs';
  const isExploreActive = currentPath === '/app/explore' || currentPath === '/explore' || currentPath === '/search';
  const isChatActive = currentPath === '/chat' || currentPath === '/messages';
  const isProfileActive = currentPath === '/profile' || currentPath === '/profile/edit' || currentPath.startsWith('/profile/');

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t py-2 px-3 flex items-center justify-around select-none transition-colors"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)'
      }}
    >
      
      {/* 1. Swipe Tab */}
      <Link
        to="/feed"
        className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 transition-colors ${
          isSwipeActive ? 'text-[#fe3c72]' : 'opacity-70 hover:opacity-100'
        }`}
        style={{ color: isSwipeActive ? '#fe3c72' : 'var(--text-muted)' }}
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M12.002 0c-4.418 0-8 3.582-8 8 0 3.313 2.016 6.16 4.908 7.377-.113-.76-.08-1.57.17-2.316.48-1.42 1.54-2.5 2.922-2.96v-.001c.21-.07.42-.12.63-.16.27-.05.54-.08.82-.08.79 0 1.53.25 2.15.68.74.52 1.25 1.3 1.41 2.2.14.77.01 1.55-.37 2.23 2.05-1.12 3.44-3.29 3.44-5.8 0-.48-.06-.94-.15-1.39C19.002 3.49 15.792 0 12.002 0z"/>
          <path d="M12.002 24c4.418 0 8-3.582 8-8 0-1.18-.26-2.3-.72-3.31-.22.61-.59 1.15-1.07 1.58-.69.62-1.58.98-2.53 1.01-.22.01-.44 0-.66-.03-.94-.12-1.78-.6-2.37-1.32-.48-.59-.73-1.33-.71-2.09.02-.76.32-1.48.84-2.03.11-.12.23-.23.36-.33-2.14.93-3.64 3.08-3.64 5.59 0 3.314 2.686 6 6 6z"/>
        </svg>
        <span className="text-[10px] font-bold tracking-tight">Swipe</span>
      </Link>

      {/* 2. Explore Tab */}
      <Link
        to="/app/explore"
        className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 transition-colors ${
          isExploreActive ? 'text-[#fe3c72]' : 'opacity-70 hover:opacity-100'
        }`}
        style={{ color: isExploreActive ? '#fe3c72' : 'var(--text-muted)' }}
      >
        <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
        </svg>
        <span className="text-[10px] font-bold tracking-tight">Explore</span>
      </Link>

      {/* 3. Likes Tab */}
      <Link
        to="/feed?tab=requests"
        className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 transition-colors relative ${
          location.search.includes('tab=requests') ? 'text-[#fe3c72]' : 'opacity-70 hover:opacity-100'
        }`}
        style={{ color: location.search.includes('tab=requests') ? '#fe3c72' : 'var(--text-muted)' }}
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span className="text-[10px] font-bold tracking-tight">Likes</span>
      </Link>

      {/* 4. Chat Tab */}
      <Link
        to="/chat"
        className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 transition-colors relative ${
          isChatActive ? 'text-[#fe3c72]' : 'opacity-70 hover:opacity-100'
        }`}
        style={{ color: isChatActive ? '#fe3c72' : 'var(--text-muted)' }}
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
        </svg>
        {unreadNotifications > 0 && (
          <span className="absolute top-0 right-3 bg-[#fe3c72] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
            {unreadNotifications}
          </span>
        )}
        <span className="text-[10px] font-bold tracking-tight">Chat</span>
      </Link>

      {/* 5. Profile Tab */}
      <Link
        to="/profile"
        className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 transition-colors ${
          isProfileActive ? 'text-[#fe3c72]' : 'opacity-70 hover:opacity-100'
        }`}
        style={{ color: isProfileActive ? '#fe3c72' : 'var(--text-muted)' }}
      >
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.firstName}
            className={`w-6 h-6 rounded-full object-cover border ${
              isProfileActive ? 'border-[#fe3c72]' : 'border-gray-500'
            }`}
          />
        ) : (
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        )}
        <span className="text-[10px] font-bold tracking-tight">Profile</span>
      </Link>

    </nav>
  );
};

export default MobileBottomNav;
