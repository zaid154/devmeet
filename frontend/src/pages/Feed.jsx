import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { FlameIcon } from '../components/Icons';
import { BASE_URL } from '../utils/constants';
import Settings from './Settings';

const Feed = () => {
  const { user } = useAuth();
  const { socket, unreadNotifications, setUnreadNotifications } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Feed State
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Drag / Swipe State
  const [dragStart, setDragStart] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [animatingSwipe, setAnimatingSwipe] = useState(null); // 'like' | 'nope' | 'super-like'

  // Sidebar Tab ('Matches' | 'Requests' | 'Messages')
  const [sidebarTab, setSidebarTab] = useState('Matches');
  const [matchesList, setMatchesList] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [conversations, setConversations] = useState([]);

  // Modals in Feed
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Profile Details Expand Drawer
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);

  // Match celebration modal
  const [matchedUser, setMatchedUser] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    fetchFeed();
    fetchMatchesAndMessages();

    // Trigger real native browser location prompt
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Native browser location received
        },
        (err) => {
          // Silently handle ignore/decline
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    }
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (matchedUser || isProfileExpanded) return;
      if (e.key === 'ArrowLeft') triggerSwipeAnimation('nope');
      else if (e.key === 'ArrowRight') triggerSwipeAnimation('like');
      else if (e.key === 'ArrowUp') setIsProfileExpanded(true);
      else if (e.key === 'ArrowDown') setIsProfileExpanded(false);
      else if (e.key === ' ') {
        e.preventDefault();
        handleNextPhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, users, matchedUser, isProfileExpanded]);

  const fetchFeed = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`${BASE_URL}/allUser?limit=50`, {
        withCredentials: true,
      });

      if (res.data.status && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
      } else {
        setUsers([]);
      }
      setCurrentIndex(0);
      setCurrentPhotoIndex(0);
    } catch (err) {
      console.error('Fetch feed error:', err);
      setUsers([]);
      setCurrentIndex(0);
      setCurrentPhotoIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchesAndMessages = async () => {
    if (!user) return;
    try {
      const matchRes = await axios.get(`${BASE_URL}/user/matches`, { withCredentials: true });
      if (matchRes.data?.status) setMatchesList(matchRes.data.data || []);
      
      const reqRes = await axios.get(`${BASE_URL}/user/request/received`, { withCredentials: true });
      if (reqRes.data?.status) setRequestsList(reqRes.data.data || []);

      const convRes = await axios.get(`${BASE_URL}/chat/conversations`, { withCredentials: true });
      if (convRes.data?.status) setConversations(convRes.data.data || []);
    } catch (e) {}
  };

  const handleAcceptRequest = async (reqId) => {
    try {
      const res = await axios.patch(`${BASE_URL}/request/${reqId}/accepted`, {}, { withCredentials: true });
      if (res.data?.status) {
        fetchMatchesAndMessages();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectRequest = async (reqId) => {
    try {
      await axios.patch(`${BASE_URL}/request/${reqId}/rejected`, {}, { withCredentials: true });
      fetchMatchesAndMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await axios.get(`${BASE_URL}/notifications`, { withCredentials: true });
      if (res.data?.status) {
        setNotificationsList(res.data.data || []);
      }
    } catch (e) {
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotificationsDrawer(true);
    fetchNotifications();
  };

  const markNotificationAsRead = async (id) => {
    try {
      await axios.patch(`${BASE_URL}/notifications/${id}/read`, {}, { withCredentials: true });
      setNotificationsList(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      if (unreadNotifications > 0 && typeof setUnreadNotifications === 'function') {
        setUnreadNotifications(prev => Math.max(0, prev - 1));
      }
    } catch (e) {}
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axios.patch(`${BASE_URL}/notifications/read-all`, {}, { withCredentials: true });
      setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
      if (typeof setUnreadNotifications === 'function') {
        setUnreadNotifications(0);
      }
    } catch (e) {}
  };

  const handleResetFeed = async () => {
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/resetFeed`, {}, { withCredentials: true });
    } catch (e) {
      console.error(e);
    }
    setCurrentIndex(0);
    setCurrentPhotoIndex(0);
    await fetchFeed();
  };

  // Ultra-Smooth 60FPS Optimistic Swipe
  const triggerSwipeAnimation = (direction) => {
    if (animatingSwipe || currentIndex >= users.length) return;
    setAnimatingSwipe(direction);
    
    // Quick hardware-accelerated dismissal
    setTimeout(() => {
      finalizeSwipe(direction === 'like' ? 'intrested' : direction === 'super-like' ? 'super-like' : 'ignore');
    }, 180);
  };

  const finalizeSwipe = (status) => {
    if (currentIndex >= users.length) return;
    const targetUser = users[currentIndex];

    // Optimistic instant UI advance (0ms lag)
    setAnimatingSwipe(null);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setCurrentIndex((prev) => prev + 1);
    setCurrentPhotoIndex(0);
    setIsProfileExpanded(false);

    // Fire API call in background without freezing UI
    if (targetUser?._id && !targetUser._id.startsWith('user-')) {
      const endpoint = status === 'super-like'
        ? `${BASE_URL}/super-like/${targetUser._id}`
        : `${BASE_URL}/sendConnection/${targetUser._id}/${status}`;

      axios.post(endpoint, {}, { withCredentials: true })
        .then((res) => {
          if (res.data?.isMatch) {
            setMatchedUser(targetUser);
          }
        })
        .catch((err) => console.error('Swipe background sync error:', err));
    }
  };

  // 60FPS Window Drag Listeners
  const animFrameRef = useRef(null);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isDragging || !dragStart) return;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      animFrameRef.current = requestAnimationFrame(() => {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setDragOffset({ x: dx, y: dy });
      });
    };

    const handleGlobalMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      setDragStart(null);

      if (dragOffset.x > 100) {
        triggerSwipeAnimation('like');
      } else if (dragOffset.x < -100) {
        triggerSwipeAnimation('nope');
      } else {
        setDragOffset({ x: 0, y: 0 });
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
      window.addEventListener('touchend', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDragging, dragStart, dragOffset]);

  const handleGlobalTouchMove = (e) => {
    if (!isDragging || !dragStart || !e.targetTouches?.[0]) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    animFrameRef.current = requestAnimationFrame(() => {
      const dx = e.targetTouches[0].clientX - dragStart.x;
      const dy = e.targetTouches[0].clientY - dragStart.y;
      setDragOffset({ x: dx, y: dy });
    });
  };

  const handleMouseDown = (e) => {
    if (isProfileExpanded || animatingSwipe) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e) => {
    if (isProfileExpanded || animatingSwipe || !e.targetTouches?.[0]) return;
    setIsDragging(true);
    setDragStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleRewind = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentPhotoIndex(0);
      setIsProfileExpanded(false);
    }
  };

  const handleNextPhoto = (e) => {
    if (e) e.stopPropagation();
    const current = users[currentIndex];
    const total = current?.photos?.length || 1;
    if (currentPhotoIndex < total - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const handlePrevPhoto = (e) => {
    if (e) e.stopPropagation();
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const currentUser = users[currentIndex];
  const nextUser = users[currentIndex + 1];

  const userPhotos = currentUser?.photos?.length > 0
    ? currentUser.photos
    : [currentUser?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'];

  const nextUserPhotos = nextUser?.photos?.length > 0
    ? nextUser.photos
    : [nextUser?.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'];

  // Hardware Accelerated Card 3D Transform
  let cardTransform = '';
  let cardOpacity = 1;
  let showLikeStamp = false;
  let showNopeStamp = false;

  if (animatingSwipe === 'like') {
    cardTransform = 'translate3d(500px, 30px, 0) rotate(24deg)';
    cardOpacity = 0;
    showLikeStamp = true;
  } else if (animatingSwipe === 'nope') {
    cardTransform = 'translate3d(-500px, 30px, 0) rotate(-24deg)';
    cardOpacity = 0;
    showNopeStamp = true;
  } else if (animatingSwipe === 'super-like') {
    cardTransform = 'translate3d(0, -600px, 0) scale(1.05)';
    cardOpacity = 0;
  } else if (isDragging) {
    const rot = dragOffset.x * 0.07;
    cardTransform = `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.15}px, 0) rotate(${rot}deg)`;
    if (dragOffset.x > 30) showLikeStamp = true;
    if (dragOffset.x < -30) showNopeStamp = true;
  }

  return (
    <div className="h-screen w-full flex bg-[#000000] text-white font-sans overflow-hidden select-none relative pb-14 md:pb-0">
      
      {/* TURN ON NOTIFICATIONS MODAL */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#161a23] rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl border border-[#252b3a] flex flex-col items-center space-y-4 animate-in zoom-in-95">
            {/* Top Speech Bubble Icon */}
            <div className="w-24 h-24 rounded-full bg-[#101319] flex items-center justify-center border border-[#252b3a] shadow-inner">
              <svg className="w-12 h-12 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.874-1.077 4.544 4.544 0 00.73-1.897C3.9 16.536 3 14.382 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>

            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Turn on notifications
            </h3>

            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              Because it's a turnoff to miss a match, message or offer.
            </p>

            <div className="w-full space-y-3 pt-2">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-full bg-[#fe3c72] hover:bg-pink-600 text-white font-bold py-3.5 rounded-full text-xs shadow-md transition-all cursor-pointer hover:scale-105"
              >
                Notify me
              </button>

              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-xs font-bold text-gray-400 hover:text-white hover:underline cursor-pointer block mx-auto pt-1"
              >
                I'll miss out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR (Matches & Messages) - Desktop only */}
      {/* ============================================================ */}
      <aside className="hidden md:flex w-80 lg:w-96 h-full bg-[#101319] border-r border-[#1f242e] flex-col shrink-0 z-30">
        
        {/* Top Profile Header (Crimson Dark Header) */}
        <div className="bg-[#161a23] border-b border-[#252b3a] text-white px-4 py-3.5 flex items-center justify-between shadow-xs">
          
          {/* User Profile Avatar */}
          <Link to="/profile" className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-500/60 shadow-xs">
              <img
                src={user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                alt={user?.firstName || 'You'}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">You</span>
          </Link>

          {/* 5 Circular Action Icons (Unified Navigation) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button 
              onClick={() => navigate('/feed')}
              className="w-9 h-9 rounded-full bg-white text-purple-600 flex items-center justify-center text-sm font-black shadow-xs cursor-pointer hover:scale-105 transition-transform"
              title="Feed / Recs (⚡)"
            >
              ⚡
            </button>
            <button 
              onClick={() => navigate('/app/explore')}
              className="w-9 h-9 rounded-full bg-[#202533] hover:bg-[#2a3142] text-amber-300 flex items-center justify-center text-sm font-bold shadow-xs cursor-pointer hover:scale-105 transition-transform"
              title="Explore & Search"
            >
              🧭
            </button>
            <button 
              onClick={() => setSidebarTab('Matches')}
              className="w-9 h-9 rounded-full bg-[#202533] hover:bg-[#2a3142] text-white flex items-center justify-center text-sm font-bold shadow-xs cursor-pointer hover:scale-105 transition-transform"
              title="Matches & Connections"
            >
              💼
            </button>
            <button 
              onClick={handleOpenNotifications}
              className="w-9 h-9 rounded-full bg-[#202533] hover:bg-[#2a3142] text-white flex items-center justify-center text-sm font-bold shadow-xs cursor-pointer hover:scale-105 transition-transform relative"
              title="Notifications"
            >
              🔔
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="w-9 h-9 rounded-full bg-[#202533] hover:bg-[#2a3142] text-white flex items-center justify-center text-sm font-bold shadow-xs cursor-pointer hover:scale-105 transition-transform"
              title="Safety & Settings"
            >
              🛡️
            </button>
          </div>

        </div>

        {/* Tab Switcher: Matches vs Likes vs Messages */}
        <div className="flex border-b border-[#252b3a] text-xs font-bold text-gray-400 bg-[#101319]">
          <button
            onClick={() => setSidebarTab('Matches')}
            className={`flex-1 py-3 text-center cursor-pointer transition-all relative ${
              sidebarTab === 'Matches'
                ? 'text-white font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Matches</span>
            {matchesList.length > 0 && (
              <span className="ml-1.5 bg-[#252b3a] text-gray-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {matchesList.length}
              </span>
            )}
            {sidebarTab === 'Matches' && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#fe3c72] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setSidebarTab('Requests')}
            className={`flex-1 py-3 text-center cursor-pointer transition-all relative ${
              sidebarTab === 'Requests'
                ? 'text-white font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Likes</span>
            {requestsList.length > 0 && (
              <span className="ml-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                {requestsList.length}
              </span>
            )}
            {sidebarTab === 'Requests' && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#fe3c72] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setSidebarTab('Messages')}
            className={`flex-1 py-3 text-center cursor-pointer transition-all relative ${
              sidebarTab === 'Messages'
                ? 'text-white font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Messages</span>
            {conversations.length > 0 && (
              <span className="ml-1.5 bg-[#252b3a] text-gray-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {conversations.length}
              </span>
            )}
            {sidebarTab === 'Messages' && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#fe3c72] rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-start">
          
          {/* TAB 1: MATCHES */}
          {sidebarTab === 'Matches' && (
            matchesList.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5">
                {matchesList.map((m) => (
                  <Link key={m._id} to="/chat" className="text-center group">
                    <div className="aspect-3/4 rounded-xl overflow-hidden border border-[#252b3a] group-hover:border-[#fe3c72] transition-colors relative shadow-xs">
                      <img src={m.profileImage || m.photos?.[0]} alt={m.firstName} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 text-[10px] text-white font-bold truncate">
                        {m.firstName}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4 max-w-xs mx-auto my-auto text-center">
                <div className="w-24 h-36 rounded-2xl bg-[#fe3c72]/20 border border-[#fe3c72]/40 shadow-lg mx-auto flex items-center justify-center text-white text-3xl">
                  ❤️
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Start Matching
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium max-w-[240px] mx-auto">
                  Matches will appear here once you both Like each other. You can message them directly when ready!
                </p>
              </div>
            )
          )}

          {/* TAB 2: LIKES / INCOMING REQUESTS */}
          {sidebarTab === 'Requests' && (
            requestsList.length > 0 ? (
              <div className="space-y-3 text-left">
                {requestsList.map((req) => {
                  const fromUser = req.fromUserId || {};
                  return (
                    <div
                      key={req._id}
                      className="bg-[#161a23] border border-[#252b3a] hover:border-pink-500/40 p-3 rounded-2xl shadow-xs transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={fromUser.profileImage || fromUser.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
                          alt={fromUser.firstName}
                          className="w-12 h-12 rounded-xl object-cover border border-[#252b3a] shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-white truncate">
                            {fromUser.firstName}, {fromUser.age || 24}
                          </h4>
                          <p className="text-[11px] text-gray-400 truncate">
                            {fromUser.job || fromUser.location || 'Interested in you'}
                          </p>
                          {req.status === 'super-like' && (
                            <span className="text-[9px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800 px-1.5 py-0.5 rounded">
                              ⭐ Super Liked you
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => handleRejectRequest(req._id)}
                          className="w-8 h-8 rounded-full bg-[#202533] hover:bg-red-900/40 text-gray-400 hover:text-red-400 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                          title="Pass"
                        >
                          ✕
                        </button>
                        <button
                          onClick={() => handleAcceptRequest(req._id)}
                          className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs transition-opacity"
                          title="Match / Accept"
                        >
                          💚
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 max-w-xs mx-auto my-auto text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-2xl">
                  ✨
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  No Pending Likes
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium max-w-[240px] mx-auto">
                  When someone likes or super likes your profile, they will appear here so you can match back!
                </p>
              </div>
            )
          )}

          {/* TAB 3: MESSAGES */}
          {sidebarTab === 'Messages' && (
            conversations.length > 0 ? (
              <div className="space-y-2 text-left">
                {conversations.map((c) => (
                  <Link
                    key={c._id}
                    to="/chat"
                    className="flex items-center space-x-3 p-2.5 rounded-2xl hover:bg-[#1c212d] transition-colors"
                  >
                    <img src={c.otherUser?.profileImage} alt="" className="w-11 h-11 rounded-full object-cover border border-[#252b3a]" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white">{c.otherUser?.firstName}</h4>
                      <p className="text-[11px] text-gray-400 truncate">{c.lastMessage?.text || 'Say hi 👋'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-w-xs mx-auto my-auto text-center">
                <div className="w-16 h-16 rounded-full bg-[#1c212d] mx-auto flex items-center justify-center text-2xl">
                  💬
                </div>
                <h4 className="text-base font-black text-white">Say Hello</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-medium max-w-[240px] mx-auto">
                  Looking to strike up a conversation? When you match with others, you can message them directly here.
                </p>
              </div>
            )
          )}

        </div>

      </aside>


      {/* ============================================================ */}
      {/* 2. MAIN CARD SWIPING STACK DECK */}
      {/* ============================================================ */}
      <main className="flex-1 h-full flex flex-col items-center justify-between p-2 sm:p-4 overflow-hidden relative select-none bg-[#000000]">
        
        {/* Mobile Top Header (Exact Match to Video 0:03) */}
        <div className="w-full max-w-md flex items-center justify-between px-3 pt-1 pb-2 select-none shrink-0">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-10 h-10 rounded-full bg-[#181c26] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-[#282f3f]"
            title="Discovery Filters"
          >
            <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
              <circle cx="8" cy="6" r="2" fill="currentColor" />
              <circle cx="16" cy="12" r="2" fill="currentColor" />
              <circle cx="10" cy="18" r="2" fill="currentColor" />
            </svg>
          </button>

          {/* Center Tabs: For You vs Double Date */}
          <div className="flex items-center space-x-6 text-sm font-black tracking-tight">
            <button className="text-white relative pb-1">
              <span>For You</span>
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#fe3c72] rounded-full"></div>
            </button>
            <button
              onClick={() => navigate('/app/explore')}
              className="text-gray-400 hover:text-gray-200 pb-1 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <span>Double Date</span>
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
            </button>
          </div>

          <button
            onClick={handleOpenNotifications}
            className="w-10 h-10 rounded-full bg-[#181c26] text-amber-400 hover:text-amber-300 flex items-center justify-center cursor-pointer transition-colors border border-[#282f3f] relative"
            title="Super Likes & Boosts"
          >
            ⚡
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-black animate-pulse"></span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 my-auto">
            <div className="relative">
              <img
                src={user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-pink-500/80 shadow-2xl animate-pulse"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#fe3c72] flex items-center justify-center text-white text-xs">
                🔥
              </div>
            </div>
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest animate-pulse">
              Finding people near you ...
            </span>
          </div>
        ) : currentIndex >= users.length ? (
          <div className="text-center space-y-5 bg-[#141721] p-8 sm:p-10 rounded-[32px] shadow-2xl border border-[#262c3b] max-w-md animate-in zoom-in-95 my-auto text-white">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#fe3c72]/15 border border-[#fe3c72]/30 mx-auto flex items-center justify-center">
              <FlameIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#fe3c72]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {users.length === 0 ? 'No matching profiles found' : "That's everyone for now!"}
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
              {users.length === 0 
                ? 'We could not find any active profiles matching your selected gender and dating preferences.' 
                : 'You have seen all available profiles matching your preferences. Check back later or reset your feed.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                onClick={handleResetFeed}
                className="w-full sm:w-auto bg-[#fe3c72] hover:bg-pink-600 text-white font-bold px-6 py-3 rounded-full text-xs uppercase tracking-wider shadow-md cursor-pointer hover:scale-105 transition-all"
              >
                Reset Feed
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="w-full sm:w-auto bg-[#202533] hover:bg-[#2a3142] text-gray-200 font-bold px-6 py-3 rounded-full text-xs uppercase tracking-wider transition-all text-center cursor-pointer hover:scale-105 border border-[#2e374a]"
              >
                Edit Preferences
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3 max-h-full my-auto">
            
            {/* SWIPE CARD STACK CONTAINER */}
            <div className="relative w-[340px] sm:w-[370px] md:w-[385px] h-[480px] sm:h-[510px] md:h-[530px] max-h-[66vh]">
              
              {/* BACK / NEXT CARD (Sits behind top card) */}
              {nextUser && (
                <div className="absolute inset-0 bg-[#161922] border border-[#262c3b] rounded-[28px] overflow-hidden shadow-xl z-10 select-none pointer-events-none">
                  <img
                    src={nextUserPhotos[0]}
                    alt={nextUser.firstName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 inset-x-3 z-20 flex gap-1.5">
                    {nextUserPhotos.map((_, pIdx) => (
                      <div key={pIdx} className="h-1 flex-1 rounded-full bg-white/40" />
                    ))}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black via-black/70 to-transparent pt-16 pb-4 px-5 text-white text-left">
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-400 mb-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Recently Active</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
                      {nextUser.firstName} {nextUser.age || 24}
                    </h2>
                    <div className="flex items-center space-x-1 text-xs text-gray-300 font-medium mt-0.5">
                      <span>📍</span>
                      <span>{nextUser.location || '14 kilometers away'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TOP ACTIVE SWIPE CARD */}
              <div 
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{
                  transform: cardTransform,
                  opacity: cardOpacity,
                  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out'
                }}
                className="absolute inset-0 bg-[#161922] border border-[#262c3b] rounded-[28px] overflow-hidden shadow-2xl z-20 select-none cursor-grab active:cursor-grabbing"
              >
                {/* Photo Image */}
                <img
                  src={userPhotos[currentPhotoIndex] || currentUser?.profileImage}
                  alt={currentUser?.firstName}
                  className="w-full h-full object-pointer-events-none"
                />

                {/* Story Segments Progress Bars at Top */}
                <div className="absolute top-2.5 inset-x-3 z-30 flex gap-1.5 pointer-events-none">
                  {userPhotos.map((_, pIdx) => (
                    <div
                      key={pIdx}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        pIdx === currentPhotoIndex ? 'bg-white shadow' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>

                {/* Tap Zones for Next/Prev Photo */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevPhoto();
                  }}
                  className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-pointer"
                  title="Previous Photo"
                />
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextPhoto();
                  }}
                  className="absolute right-0 inset-y-0 w-1/3 z-20 cursor-pointer"
                  title="Next Photo"
                />

                {/* LIKE STAMP (Giant Crimson Heart on Left Swipe) */}
                {showLikeStamp && (
                  <div className="absolute top-8 left-6 z-40 animate-in zoom-in-75 duration-100 pointer-events-none">
                    <div className="w-18 h-18 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl transform -rotate-12 border-4 border-white">
                      <span className="text-3xl">♥</span>
                    </div>
                  </div>
                )}

                {/* NOPE STAMP (Giant White/Gray Cross on Right Swipe) */}
                {showNopeStamp && (
                  <div className="absolute top-8 right-6 z-40 animate-in zoom-in-75 duration-100 pointer-events-none">
                    <div className="w-18 h-18 rounded-full bg-white/90 text-gray-700 flex items-center justify-center shadow-2xl transform rotate-12 border-4 border-gray-300 font-black text-3xl">
                      ✕
                    </div>
                  </div>
                )}

                {/* Bottom Info Gradient */}
                <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent pt-16 pb-4 px-5 text-white text-left pointer-events-none">
                  
                  {/* Status Pill */}
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20 inline-flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                      <span>{currentUser?.statusBadge || 'Nearby'}</span>
                    </span>
                  </div>

                  {/* Name + Age + Verified */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md text-white">
                        {currentUser?.firstName} {currentUser?.age || 24}
                      </h2>
                      {currentUser?.isVerified && (
                        <span className="w-5 h-5 rounded-full bg-[#1d9bf0] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Upward Chevron Arrow Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(!isProfileExpanded);
                      }}
                      className="pointer-events-auto w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center font-bold text-xs backdrop-blur-md transition-all cursor-pointer hover:scale-110"
                      title="View Full Profile Details"
                    >
                      {isProfileExpanded ? '⬇' : '⬆'}
                    </button>
                  </div>

                  {/* Location distance */}
                  <div className="flex items-center space-x-1.5 text-xs text-gray-200 font-medium mt-1">
                    <span>📍</span>
                    <span>{currentUser?.location || '1 km away'}</span>
                  </div>

                  {/* Bio & Interests Preview if expanded */}
                  {isProfileExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/20 space-y-2 pointer-events-auto animate-in fade-in duration-200">
                      {currentUser?.bio && (
                        <p className="text-xs text-gray-200 line-clamp-3 leading-relaxed">
                          {currentUser.bio}
                        </p>
                      )}

                      {currentUser?.job && (
                        <div className="flex items-center space-x-1.5 text-xs text-gray-300">
                          <span>💼</span>
                          <span>{currentUser.job}</span>
                        </div>
                      )}

                      {currentUser?.interests?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {currentUser.interests.map((t, tIdx) => (
                            <span key={tIdx} className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>

            </div>


            {/* 5 GAMEPAD ACTION BUTTONS (Exact Match to Video 0:10) */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 pt-1 shrink-0">
              
              {/* 1. Rewind */}
              <button
                onClick={handleRewind}
                className="w-12 h-12 rounded-full bg-[#181c26] text-yellow-400 hover:text-yellow-300 shadow-lg border border-[#2a3142] flex items-center justify-center font-bold text-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Rewind (↺)"
              >
                ↺
              </button>

              {/* 2. Nope (✕) */}
              <button
                onClick={() => triggerSwipeAnimation('nope')}
                className="w-16 h-16 rounded-full bg-[#181c26] text-gray-200 hover:text-red-500 shadow-xl border border-[#2a3142] flex items-center justify-center font-black text-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Nope (←)"
              >
                ✕
              </button>

              {/* 3. Super Like (⭐) */}
              <button
                onClick={() => triggerSwipeAnimation('super-like')}
                className="w-12 h-12 rounded-full bg-[#181c26] text-blue-400 hover:text-blue-300 shadow-lg border border-[#2a3142] flex items-center justify-center font-bold text-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Super Like (⭐)"
              >
                ⭐
              </button>

              {/* 4. Like (♥) */}
              <button
                onClick={() => triggerSwipeAnimation('like')}
                className={`w-16 h-16 rounded-full border shadow-xl flex items-center justify-center font-black text-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                  animatingSwipe === 'like'
                    ? 'bg-gradient-to-tr from-[#fe3c72] to-[#ff6036] text-white border-transparent shadow-pink-900/50'
                    : 'bg-[#181c26] text-[#fe3c72] hover:bg-[#fe3c72] hover:text-white border-[#2a3142]'
                }`}
                title="Like (→)"
              >
                ♥
              </button>

              {/* 5. Boost / Send (✈️) */}
              <button
                onClick={() => navigate('/chat')}
                className="w-12 h-12 rounded-full bg-[#181c26] text-purple-400 hover:text-purple-300 border border-[#2a3142] shadow-lg flex items-center justify-center font-bold text-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Send / Chat"
              >
                ✈
              </button>

            </div>


            {/* KEYBOARD SHORTCUTS LEGEND (Desktop only) */}
            <div className="hidden lg:flex items-center space-x-2 text-[10px] font-bold text-gray-400 pt-1 shrink-0 select-none">
              <span className="bg-[#202533] text-white px-3.5 py-1 rounded-full text-[11px] font-black cursor-pointer hover:bg-black border border-[#2a3142]">DevMeet Deck</span>
              <span className="bg-[#181c26] border border-[#2a3142] px-2 py-0.5 rounded-md text-gray-300 flex items-center space-x-1 font-semibold"><span>⬅</span><span>Nope</span></span>
              <span className="bg-[#181c26] border border-[#2a3142] px-2 py-0.5 rounded-md text-gray-300 flex items-center space-x-1 font-semibold"><span>➡</span><span>Like</span></span>
              <span className="bg-[#181c26] border border-[#2a3142] px-2 py-0.5 rounded-md text-gray-300 flex items-center space-x-1 font-semibold"><span>⬆</span><span>Open Profile</span></span>
              <span className="bg-[#181c26] border border-[#2a3142] px-2 py-0.5 rounded-md text-gray-300 flex items-center space-x-1 font-semibold"><span>⮐</span><span>Super Like</span></span>
              <span className="bg-[#181c26] border border-[#2a3142] px-3 py-0.5 rounded-md text-gray-300 flex items-center space-x-1.5 font-semibold"><span className="w-8 h-2.5 border border-gray-600 rounded-xs inline-block"></span><span>Next Photo</span></span>
            </div>

          </div>
        )}

      </main>


      {/* ============================================================ */}
      {/* MATCH CELEBRATION MODAL */}
      {/* ============================================================ */}
      {matchedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in zoom-in-95">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl font-black text-[#fe3c72]" style={{ fontFamily: 'Georgia, serif' }}>
              It's a Match!
            </h2>
            <p className="text-xs text-gray-600">
              You and {matchedUser.firstName} have liked each other.
            </p>
            <div className="flex justify-center space-x-3">
              <img src={user?.profileImage} alt="You" className="w-20 h-20 rounded-full object-cover border-4 border-[#fe3c72]" />
              <img src={matchedUser.profileImage || matchedUser.photos?.[0]} alt={matchedUser.firstName} className="w-20 h-20 rounded-full object-cover border-4 border-[#fe3c72]" />
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => navigate('/chat')}
                className="w-full bg-[#fe3c72] text-white font-bold py-3.5 rounded-full text-xs shadow-md cursor-pointer"
              >
                Send a Message
              </button>
              <button
                onClick={() => setMatchedUser(null)}
                className="w-full bg-gray-100 text-gray-800 font-bold py-3.5 rounded-full text-xs cursor-pointer"
              >
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ============================================================ */}
      {/* 4. NOTIFICATIONS DRAWER IN FEED */}
      {/* ============================================================ */}
      {showNotificationsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔔</span>
                <div>
                  <h3 className="font-bold text-base tracking-tight text-white">Notifications</h3>
                  <p className="text-[11px] text-slate-300">Matches, likes, and platform updates</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {notificationsList.some(n => !n.read) && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] font-bold text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotificationsDrawer(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {loadingNotifications ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <div className="w-7 h-7 border-2 border-[#fe3c72] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-semibold">Loading updates...</p>
                </div>
              ) : notificationsList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2 my-auto">
                  <div className="w-14 h-14 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-2xl text-slate-400">
                    🔔
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">No Notifications</h4>
                  <p className="text-xs text-slate-500">You're all caught up! Likes and matches will appear here.</p>
                </div>
              ) : (
                notificationsList.map((n) => {
                  return (
                    <div
                      key={n._id}
                      onClick={() => {
                        if (!n.read) markNotificationAsRead(n._id);
                        if (n.type === 'match' || n.type === 'message') {
                          setShowNotificationsDrawer(false);
                          setSidebarTab(n.type === 'match' ? 'Matches' : 'Messages');
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer ${
                        n.read
                          ? 'bg-slate-50/70 border-slate-100 text-slate-600'
                          : 'bg-white border-pink-200 ring-1 ring-pink-100 text-slate-900 shadow-xs'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                        {n.type === 'match' ? '💖' : n.type === 'message' ? '💬' : '🔔'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900 truncate">{n.title}</h5>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message || n.body}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
              <button
                onClick={() => setShowNotificationsDrawer(false)}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ============================================================ */}
      {/* 5. IN-FEED SETTINGS & PREFERENCES MODAL */}
      {/* ============================================================ */}
      {showSettingsModal && (
        <Settings
          isModal={true}
          onClose={() => setShowSettingsModal(false)}
          onSaved={() => {
            fetchFeed();
          }}
        />
      )}

    </div>
  );
};

export default Feed;
