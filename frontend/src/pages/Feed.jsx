import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { FlameIcon } from '../components/Icons';
import { BASE_URL } from '../utils/constants';

const Feed = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

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

  // Sidebar Tab ('Matches' | 'Messages')
  const [sidebarTab, setSidebarTab] = useState('Matches');
  const [matchesList, setMatchesList] = useState([]);
  const [conversations, setConversations] = useState([]);

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
      
      const convRes = await axios.get(`${BASE_URL}/chat/conversations`, { withCredentials: true });
      if (convRes.data?.status) setConversations(convRes.data.data || []);
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
    <div className="h-screen w-full flex bg-[#e8ebef] font-sans overflow-hidden select-none relative">
      
      {/* TURN ON NOTIFICATIONS MODAL */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 flex flex-col items-center space-y-4 animate-in zoom-in-95">
            {/* Top Speech Bubble Icon */}
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 shadow-inner">
              <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.874-1.077 4.544 4.544 0 00.73-1.897C3.9 16.536 3 14.382 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Turn on notifications
            </h3>

            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Because it's a turnoff to miss a match, message or offer.
            </p>

            <div className="w-full space-y-3 pt-2">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3.5 rounded-full text-xs shadow-md transition-all cursor-pointer hover:scale-105"
              >
                Notify me
              </button>

              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-xs font-bold text-gray-800 hover:text-black hover:underline cursor-pointer block mx-auto pt-1"
              >
                I'll miss out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR (Matches & Messages) */}
      {/* ============================================================ */}
      <aside className="w-80 lg:w-96 h-full bg-white border-r border-gray-200 flex flex-col shrink-0 z-30">
        
        {/* Top Profile Header (Crimson Red Header) */}
        <div className="bg-[#e01438] text-white px-4 py-3.5 flex items-center justify-between shadow-xs">
          
          {/* User Profile Avatar */}
          <Link to="/profile" className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/60 shadow-xs">
              <img
                src={user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                alt={user?.firstName || 'You'}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">You</span>
          </Link>

          {/* 4 Circular Action Icons (Matching Screenshot 3) */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/feed')}
              className="w-9 h-9 rounded-full bg-white text-purple-600 flex items-center justify-center text-sm font-black shadow-xs cursor-pointer hover:scale-105 transition-transform"
              title="Boost (⚡)"
            >
              ⚡
            </button>
            <button 
              onClick={() => navigate('/app/explore')}
              className="w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-amber-300 flex items-center justify-center text-sm font-bold shadow-xs cursor-pointer hover:scale-105 transition-transform"
              title="Explore / Radar"
            >
              🧭
            </button>
            <button 
              onClick={() => navigate('/connections')}
              className="w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center text-sm font-bold shadow-xs cursor-pointer hover:scale-105 transition-transform"
              title="Work / Network"
            >
              💼
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center text-sm font-bold shadow-xs cursor-pointer hover:scale-105 transition-transform"
              title="Safety & Settings"
            >
              🛡️
            </button>
          </div>

        </div>

        {/* Tab Switcher: Matches vs Messages */}
        <div className="flex border-b border-gray-200 text-xs font-bold text-gray-700 bg-white">
          <button
            onClick={() => setSidebarTab('Matches')}
            className={`flex-1 py-3 text-center cursor-pointer transition-all relative ${
              sidebarTab === 'Matches'
                ? 'text-gray-900 font-extrabold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Matches
            {sidebarTab === 'Matches' && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#e01438] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setSidebarTab('Messages')}
            className={`flex-1 py-3 text-center cursor-pointer transition-all relative ${
              sidebarTab === 'Messages'
                ? 'text-gray-900 font-extrabold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Messages
            {sidebarTab === 'Messages' && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#e01438] rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center text-center">
          
          {sidebarTab === 'Matches' && (
            matchesList.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5">
                {matchesList.map((m) => (
                  <Link key={m._id} to="/chat" className="text-center group">
                    <div className="aspect-3/4 rounded-xl overflow-hidden border border-gray-200 group-hover:border-[#fe3c72] transition-colors relative">
                      <img src={m.profileImage || m.photos?.[0]} alt={m.firstName} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[10px] text-white font-bold truncate">
                        {m.firstName}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Empty State Matching Screenshot 3 */
              <div className="space-y-4 max-w-xs mx-auto my-auto">
                <div className="w-28 h-44 rounded-2xl bg-[#c8102e] shadow-lg mx-auto flex items-center justify-center">
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  Start Matching
                </h3>
                
                <p className="text-xs text-gray-500 leading-relaxed font-medium max-w-[260px] mx-auto">
                  Matches will appear here once you start to Like people. You can message them directly from here when you're ready to spark up the conversation.
                </p>
              </div>
            )
          )}

          {sidebarTab === 'Messages' && (
            conversations.length > 0 ? (
              <div className="space-y-2 text-left">
                {conversations.map((c) => (
                  <Link
                    key={c._id}
                    to="/chat"
                    className="flex items-center space-x-3 p-2.5 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <img src={c.otherUser?.profileImage} alt="" className="w-11 h-11 rounded-full object-cover border" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900">{c.otherUser?.firstName}</h4>
                      <p className="text-[11px] text-gray-500 truncate">{c.lastMessage?.text || 'Say hi 👋'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-w-xs mx-auto my-auto text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center text-2xl">
                  💬
                </div>
                <h4 className="text-base font-black text-gray-900">Say Hello</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Looking to strike up a conversation? When you match with others, you can send them a message here.
                </p>
              </div>
            )
          )}

        </div>

      </aside>


      {/* ============================================================ */}
      {/* 2. MAIN CARD SWIPING STACK DECK */}
      {/* ============================================================ */}
      <main className="flex-1 h-full flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden relative select-none">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <FlameIcon className="w-16 h-16 text-[#fe3c72] animate-pulse" />
            <span className="text-sm font-extrabold text-gray-500 uppercase tracking-wider">Finding Matches nearby...</span>
          </div>
        ) : currentIndex >= users.length ? (
          <div className="text-center space-y-5 bg-white p-8 sm:p-10 rounded-[32px] shadow-xl border border-gray-100 max-w-md animate-in zoom-in-95 my-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-pink-100 to-red-50 mx-auto flex items-center justify-center">
              <FlameIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#fe3c72]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              {users.length === 0 ? 'No matching profiles found' : "That's everyone for now!"}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              {users.length === 0 
                ? 'We could not find any active profiles matching your selected gender and dating preferences.' 
                : 'You have seen all available profiles matching your preferences. Check back later or reset your feed.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                onClick={handleResetFeed}
                className="w-full sm:w-auto bg-black hover:bg-gray-900 text-white font-bold px-6 py-3 rounded-full text-xs uppercase tracking-wider shadow-md cursor-pointer hover:scale-105 transition-all"
              >
                Reset Feed
              </button>
              <Link
                to="/settings"
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-3 rounded-full text-xs uppercase tracking-wider transition-all text-center"
              >
                Edit Preferences
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3 max-h-full my-auto">
            
            {/* SWIPE CARD STACK CONTAINER */}
            <div className="relative w-[340px] sm:w-[370px] md:w-[385px] h-[480px] sm:h-[510px] md:h-[530px] max-h-[66vh]">
              
              {/* BACK / NEXT CARD (Sits behind top card) */}
              {nextUser && (
                <div className="absolute inset-0 bg-black rounded-[28px] overflow-hidden shadow-xl z-10 select-none pointer-events-none">
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
                  <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black via-black/60 to-transparent pt-16 pb-4 px-5 text-white text-left">
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
                className="absolute inset-0 bg-black rounded-[28px] overflow-hidden shadow-2xl z-20 select-none cursor-grab active:cursor-grabbing"
              >
                {/* Photo Image */}
                <img
                  src={userPhotos[currentPhotoIndex] || currentUser?.profileImage}
                  alt={currentUser?.firstName}
                  className="w-full h-full object-cover pointer-events-none"
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

                {/* Floating Left `<` & Right `>` Photo Navigation Buttons */}
                {userPhotos.length > 1 && (
                  <>
                    {currentPhotoIndex > 0 && (
                      <button
                        onClick={handlePrevPhoto}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-900 flex items-center justify-center text-xs font-black shadow-lg cursor-pointer transition-transform hover:scale-110"
                        title="Previous Photo"
                      >
                        ‹
                      </button>
                    )}
                    {currentPhotoIndex < userPhotos.length - 1 && (
                      <button
                        onClick={handleNextPhoto}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-900 flex items-center justify-center text-xs font-black shadow-lg cursor-pointer transition-transform hover:scale-110"
                        title="Next Photo"
                      >
                        ›
                      </button>
                    )}
                  </>
                )}

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
                <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black via-black/70 to-transparent pt-16 pb-4 px-5 text-white text-left pointer-events-none">
                  
                  {/* Recently Active */}
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-400 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Recently Active</span>
                  </div>

                  {/* Name + Age + Verified Badge + Up Arrow Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
                        {currentUser?.firstName} {currentUser?.age || 24}
                      </h2>
                      {currentUser?.isVerified && (
                        <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                          ✓
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(!isProfileExpanded);
                      }}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-sm font-black transition-all cursor-pointer backdrop-blur-xs pointer-events-auto"
                      title="Open Profile"
                    >
                      {isProfileExpanded ? '↓' : '↑'}
                    </button>
                  </div>

                  {/* City & Distance */}
                  <div className="space-y-0.5 mt-0.5 text-xs text-gray-300 font-medium">
                    {currentUser?.city && (
                      <p className="flex items-center space-x-1">
                        <span>🏠</span>
                        <span>{currentUser.city}</span>
                      </p>
                    )}
                    <p className="flex items-center space-x-1">
                      <span>📍</span>
                      <span>{currentUser?.location || '14 kilometers away'}</span>
                    </p>
                  </div>

                  {/* Expanded Profile Details */}
                  {isProfileExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/20 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-auto max-h-36 overflow-y-auto pr-1">
                      {currentUser?.bio && (
                        <p className="text-xs text-gray-200 leading-relaxed">{currentUser.bio}</p>
                      )}
                      
                      {currentUser?.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {currentUser.skills.map((s, sIdx) => (
                            <span key={sIdx} className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {currentUser?.interests?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {currentUser.interests.map((t, tIdx) => (
                            <span key={tIdx} className="border border-white/30 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
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


            {/* 5 GAMEPAD ACTION BUTTONS (Exact Match to Screenshot 3) */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 pt-1 shrink-0">
              
              {/* 1. Rewind */}
              <button
                onClick={handleRewind}
                className="w-12 h-12 rounded-full bg-white text-gray-400 hover:text-yellow-500 shadow-md border border-gray-100 flex items-center justify-center font-bold text-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Rewind (↺)"
              >
                ↺
              </button>

              {/* 2. Nope (✕) */}
              <button
                onClick={() => triggerSwipeAnimation('nope')}
                className="w-16 h-16 rounded-full bg-white text-gray-800 hover:text-red-500 shadow-xl border border-gray-100 flex items-center justify-center font-black text-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Nope (←)"
              >
                ✕
              </button>

              {/* 3. Super Like (⭐) */}
              <button
                onClick={() => triggerSwipeAnimation('super-like')}
                className="w-12 h-12 rounded-full bg-white text-blue-400 hover:text-blue-500 shadow-md border border-gray-100 flex items-center justify-center font-bold text-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Super Like (⭐)"
              >
                ⭐
              </button>

              {/* 4. Like (♥) */}
              <button
                onClick={() => triggerSwipeAnimation('like')}
                className={`w-16 h-16 rounded-full border shadow-xl flex items-center justify-center font-black text-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                  animatingSwipe === 'like'
                    ? 'bg-red-600 text-white border-red-600 shadow-red-300'
                    : 'bg-white text-red-500 hover:bg-pink-50 border-gray-100'
                }`}
                title="Like (→)"
              >
                ♥
              </button>

              {/* 5. Boost / Send (✈️) */}
              <button
                onClick={() => navigate('/chat')}
                className="w-12 h-12 rounded-full bg-white text-blue-500 hover:bg-blue-50 border border-gray-100 shadow-md flex items-center justify-center font-bold text-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Send / Chat"
              >
                ✈
              </button>

            </div>


            {/* KEYBOARD SHORTCUTS LEGEND (Exact Match to Screenshot 3) */}
            <div className="hidden lg:flex items-center space-x-2 text-[10px] font-bold text-gray-500 pt-1 shrink-0 select-none">
              <span className="bg-[#2b2b2b] text-white px-3.5 py-1 rounded-full text-[11px] font-black cursor-pointer hover:bg-black">Hide</span>
              <span className="bg-white border border-gray-300 px-2 py-0.5 rounded-md text-gray-700 flex items-center space-x-1 font-semibold"><span>⬅</span><span>Nope</span></span>
              <span className="bg-white border border-gray-300 px-2 py-0.5 rounded-md text-gray-700 flex items-center space-x-1 font-semibold"><span>➡</span><span>Like</span></span>
              <span className="bg-white border border-gray-300 px-2 py-0.5 rounded-md text-gray-700 flex items-center space-x-1 font-semibold"><span>⬆</span><span>Open Profile</span></span>
              <span className="bg-white border border-gray-300 px-2 py-0.5 rounded-md text-gray-700 flex items-center space-x-1 font-semibold"><span>⬇</span><span>Close Profile</span></span>
              <span className="bg-white border border-gray-300 px-2 py-0.5 rounded-md text-gray-700 flex items-center space-x-1 font-semibold"><span>⮐</span><span>Super Like</span></span>
              <span className="bg-white border border-gray-300 px-3 py-0.5 rounded-md text-gray-700 flex items-center space-x-1.5 font-semibold"><span className="w-8 h-2.5 border border-gray-400 rounded-xs inline-block"></span><span>Next Photo</span></span>
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

    </div>
  );
};

export default Feed;
