import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  FlameIcon,
  SearchIcon,
  HeartIcon,
  ChatIcon,
  BellIcon,
  ShieldIcon
} from './Icons';
import AnnouncementBanner from './AnnouncementBanner';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadNotifications } = useSocket();
  const location = useLocation();

  if (
    location.pathname === '/signup' ||
    location.pathname === '/app/onboarding' ||
    location.pathname === '/feed' ||
    location.pathname === '/app/recs' ||
    location.pathname === '/app/explore' ||
    location.pathname === '/explore' ||
    location.pathname === '/search' ||
    location.pathname === '/chat' ||
    location.pathname === '/messages'
  ) {
    return null;
  }


  const isLandingPage = location.pathname === '/';
  const isStaff = user && ['super-admin', 'admin', 'moderator', 'support'].includes(user.role);

  const inAppNavLinks = [
    { name: 'Discover', path: '/feed', icon: FlameIcon },
    { name: 'Search', path: '/search', icon: SearchIcon },
    { name: 'Matches', path: '/feed', icon: HeartIcon },
    { name: 'Messages', path: '/chat', icon: ChatIcon },
    { name: 'Notifications', path: '/feed', icon: BellIcon, badge: unreadNotifications }
  ];

  const [showLangModal, setShowLangModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English (US)');

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 62; // Exact fixed header height with minimal gap
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Landing Page Header (Exact Match to Picture)
  if (isLandingPage && !isAuthenticated) {
    return (
      <>
        <header className="fixed top-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 py-3 sm:py-3.5 px-4 sm:px-8 lg:px-14 flex items-center justify-between font-sans select-none">
          
          {/* Left: Bold All-Caps Red Brand Logo */}
          <Link to="/" className="flex items-center space-x-1.5 group shrink-0">
            <div className="text-[#c8102e] transform group-hover:scale-105 transition-transform">
              <FlameIcon className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9" />
            </div>
            <span 
              className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-900"
              style={{ fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            >
              dev<span className="text-[#c8102e]">meet</span>
            </span>
          </Link>

          {/* Middle Navigation Links (100% Working Smooth Scroll) */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-gray-700">
            <button onClick={() => scrollTo('features')} className="hover:text-[#c8102e] transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollTo('safety')} className="hover:text-[#c8102e] transition-colors cursor-pointer">
              Safety
            </button>
            <button onClick={() => scrollTo('subscriptions')} className="hover:text-[#c8102e] transition-colors cursor-pointer">
              Plans
            </button>
            <button onClick={() => scrollTo('support')} className="hover:text-[#c8102e] transition-colors cursor-pointer">
              Support
            </button>
          </nav>

          {/* Right: Language & Log in Button */}
          <div className="flex items-center space-x-3 sm:space-x-5 shrink-0">
            <button 
              onClick={() => setShowLangModal(true)}
              className="hidden md:flex items-center space-x-1.5 text-xs font-bold text-gray-800 hover:text-black cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
            >
              <span className="text-sm">文A</span>
              <span>{selectedLang}</span>
            </button>

            <Link
              to="/login"
              className="bg-[#c8102e] hover:bg-[#a50d25] text-white font-bold text-xs sm:text-sm px-5 sm:px-7 py-2 sm:py-2.5 rounded-full shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              Log in
            </Link>
          </div>

        </header>

        {/* Interactive Language Selector Modal */}
        {showLangModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base text-gray-900">Select Language</h3>
                <button onClick={() => setShowLangModal(false)} className="text-gray-400 hover:text-gray-900 text-lg cursor-pointer">✕</button>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {['English (US)', 'Hindi (हिंदी)', 'Spanish (Español)', 'French (Français)', 'German (Deutsch)', 'Japanese (日本語)'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLang(lang.split(' ')[0]);
                      setShowLangModal(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      selectedLang === lang.split(' ')[0] ? 'bg-pink-50 text-[#c8102e]' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span>{lang}</span>
                    {selectedLang === lang.split(' ')[0] && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // In-App Authenticated Header
  return (
    <div className="fixed top-0 left-0 w-full z-40">
      <AnnouncementBanner />

      <header className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-3 w-full bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200 shadow-2xs font-sans">
        
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center space-x-6 lg:space-x-8">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-[#fe3c72] text-white p-1.5 rounded-xl shadow-2xs transition-transform group-hover:scale-105">
              <FlameIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Dev<span className="text-[#fe3c72]">Meet</span>
            </span>
          </Link>

          {/* Navigation Links with Clean SVG Icons */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold text-slate-600">
              {inAppNavLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`px-3.5 py-1.5 rounded-full transition-all flex items-center space-x-1.5 relative ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-[#fe3c72]' : 'text-slate-400'}`} />
                    <span>{link.name}</span>
                    {link.badge > 0 && (
                      <span className="bg-[#fe3c72] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center -ml-0.5">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right: Auth / Profile Controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 text-xs font-semibold">
          
          {/* Admin Panel Quick Link for Staff */}
          {isStaff && (
            <Link
              to="/admin"
              className="bg-slate-900 hover:bg-black text-white px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all"
            >
              <ShieldIcon className="w-3.5 h-3.5 text-slate-300" />
              <span>Admin Panel</span>
            </Link>
          )}

          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <Link
                to="/profile"
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors text-slate-800"
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.firstName}
                    className="w-5 h-5 rounded-full object-cover border border-slate-300"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.firstName?.[0]}
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-900">{user.firstName}</span>
                {user.isVerified && (
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold px-1 rounded">✓</span>
                )}
              </Link>

              <button
                onClick={logout}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-full font-semibold text-xs transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-slate-700 hover:text-slate-900 px-3.5 py-1.5 rounded-full font-semibold transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="bg-[#fe3c72] hover:bg-[#e03463] text-white px-4 py-1.5 rounded-full font-semibold shadow-xs transition-all cursor-pointer"
              >
                Create account
              </Link>
            </div>
          )}
        </div>

      </header>
    </div>
  );
};

export default Header;
