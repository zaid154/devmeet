import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../utils/constants';

const EXPLORE_CATEGORIES = [
  {
    id: 'long-term',
    title: 'Long-term partner',
    icon: '🌹',
    color: 'from-[#3a0a6a] via-[#240346] to-[#140026]',
    description: 'Looking for something real and lasting'
  },
  {
    id: 'short-term',
    title: 'Short-term fun',
    icon: '🍭',
    color: 'from-[#3a0a6a] via-[#240346] to-[#140026]',
    description: 'Here for a good time, not a long time'
  },
  {
    id: 'friends',
    title: 'New friends',
    icon: '🖐️',
    color: 'from-[#3a0a6a] via-[#240346] to-[#140026]',
    description: 'Expand your circle and vibe'
  },
  {
    id: 'non-monogamous',
    title: 'Non-monogamous',
    icon: '🍍',
    color: 'from-[#3a0a6a] via-[#240346] to-[#140026]',
    description: 'Open to exploring connections'
  },
  {
    id: 'coffee',
    title: 'Coffee Date',
    icon: '☕',
    color: 'from-[#3a0a6a] via-[#240346] to-[#140026]',
    description: 'Casual chats over warm brew'
  },
  {
    id: 'free-tonight',
    title: 'Free Tonight',
    icon: '🌙',
    color: 'from-[#3a0a6a] via-[#240346] to-[#140026]',
    description: 'Ready to hang out and chill'
  },
  {
    id: 'looking-for-love',
    title: 'Looking for Love',
    icon: '💘',
    color: 'from-[#3a0a6a] via-[#240346] to-[#140026]',
    description: 'Hoping to find that special spark'
  },
  {
    id: 'gamers',
    title: 'Gamers & Tech',
    icon: '🎮',
    color: 'from-[#3a0a6a] via-[#240346] to-[#140026]',
    description: 'Co-op sessions & tech talks'
  }
];

const Explore = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('long-term');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);

  // Drag / Swipe Physics
  const [dragStart, setDragStart] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [animatingSwipe, setAnimatingSwipe] = useState(null);

  const fetchCategoryUsers = async (category) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/allUser?category=${category}&limit=30`, {
        withCredentials: true
      });
      if (res.data.status && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
      } else {
        setUsers([]);
      }
      setCurrentIndex(0);
      setCurrentPhotoIndex(0);
    } catch (err) {
      console.error('Explore fetch error:', err);
      setUsers([]);
      setCurrentIndex(0);
      setCurrentPhotoIndex(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryUsers(selectedCategory);
  }, [selectedCategory]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isProfileExpanded) return;
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
  }, [currentIndex, users, isProfileExpanded]);

  // Handle category tile click
  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
  };

  // Ultra-Smooth 60FPS Optimistic Swipe
  const triggerSwipeAnimation = (direction) => {
    if (animatingSwipe || currentIndex >= users.length) return;
    setAnimatingSwipe(direction);
    
    setTimeout(() => {
      finalizeSwipe(direction === 'like' ? 'intrested' : direction === 'super-like' ? 'super-like' : 'ignore');
    }, 180);
  };

  const finalizeSwipe = (status) => {
    if (currentIndex >= users.length) return;
    const targetUser = users[currentIndex];

    setAnimatingSwipe(null);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setCurrentIndex((prev) => prev + 1);
    setCurrentPhotoIndex(0);
    setIsProfileExpanded(false);

    if (targetUser?._id && !targetUser._id.startsWith('user-')) {
      const endpoint = status === 'super-like'
        ? `${BASE_URL}/super-like/${targetUser._id}`
        : `${BASE_URL}/sendConnection/${targetUser._id}/${status}`;

      axios.post(endpoint, {}, { withCredentials: true }).catch(() => {});
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
      window.addEventListener('touchend', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDragging, dragStart, dragOffset]);

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
      
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR (Explore Categories) */}
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

          {/* 4 Circular Action Icons (Explore / Radar Active State) */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/feed')}
              className="w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-purple-300 flex items-center justify-center text-sm font-black shadow-xs cursor-pointer hover:scale-105 transition-transform"
              title="Feed / Recs (⚡)"
            >
              ⚡
            </button>
            <button 
              onClick={() => navigate('/app/explore')}
              className="w-9 h-9 rounded-full bg-white text-gray-900 flex items-center justify-center text-sm font-bold shadow-md cursor-pointer hover:scale-105 transition-transform"
              title="Explore / Radar (Active)"
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

        {/* Explore Sub-Header Title */}
        <div className="p-4 pb-2 border-b border-gray-100">
          <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-snug">
            Find people with similar relationship goals
          </h3>
        </div>

        {/* 2-Column Grid of 3D Explore Category Cards (Exact Match to Picture 2) */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {EXPLORE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`bg-gradient-to-b ${cat.color} rounded-2xl p-3.5 flex flex-col justify-between aspect-4/5 text-white shadow-md cursor-pointer transition-all duration-200 text-left relative overflow-hidden group hover:scale-[1.02] ${
                    isSelected ? 'ring-3 ring-[#fe3c72] shadow-xl' : 'hover:shadow-lg'
                  }`}
                >
                  {/* Glossy 3D Illustration */}
                  <div className="text-4xl sm:text-5xl drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    {cat.icon}
                  </div>

                  {/* Title Label */}
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-white drop-shadow-xs">
                      {cat.title}
                    </h4>
                  </div>

                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#fe3c72] shadow-xs animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </aside>


      {/* ============================================================ */}
      {/* 2. MAIN SWIPING DECK (Exact Match to Screenshot 2) */}
      {/* ============================================================ */}
      <main className="flex-1 h-full flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden relative">
        
        {currentUser ? (
          <div className="flex flex-col items-center justify-center w-full max-w-[420px] h-full max-h-[96vh] py-1 gap-2">
            
            {/* Card Frame Stack */}
            <div className="relative w-[340px] sm:w-[370px] md:w-[385px] h-[480px] sm:h-[510px] md:h-[530px] max-h-[66vh] shrink-0">
              
              {/* UNDERNEATH CARD */}
              {nextUser && (
                <div className="absolute inset-0 bg-black rounded-[28px] overflow-hidden shadow-md transform scale-[0.97] translate-y-1.5 opacity-90 transition-all pointer-events-none">
                  <img
                    src={nextUserPhotos[0]}
                    alt={nextUser.firstName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 text-white">
                    <h2 className="text-2xl font-black tracking-tight">
                      {nextUser.firstName} {nextUser.age || 22}
                    </h2>
                    <p className="text-xs text-gray-300">📍 {nextUser.location || '35 kilometers away'}</p>
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
                {/* Photo */}
                <img
                  src={userPhotos[currentPhotoIndex] || currentUser?.profileImage}
                  alt={currentUser?.firstName}
                  className="w-full h-full object-cover pointer-events-none"
                />

                {/* LIKE STAMP BADGE */}
                {showLikeStamp && (
                  <div className="absolute top-8 left-8 z-30 border-4 border-emerald-400 text-emerald-400 font-black text-2xl px-4 py-1 rounded-xl transform -rotate-15 uppercase tracking-wider backdrop-blur-xs bg-black/20">
                    LIKE
                  </div>
                )}

                {/* NOPE STAMP BADGE */}
                {showNopeStamp && (
                  <div className="absolute top-8 right-8 z-30 border-4 border-red-500 text-red-500 font-black text-2xl px-4 py-1 rounded-xl transform rotate-15 uppercase tracking-wider backdrop-blur-xs bg-black/20">
                    NOPE
                  </div>
                )}

                {/* Story Segmented Progress Bars */}
                {userPhotos.length > 1 && (
                  <div className="absolute top-3 inset-x-3 z-30 flex items-center space-x-1.5">
                    {userPhotos.map((_, pIdx) => (
                      <div 
                        key={pIdx}
                        className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                          pIdx === currentPhotoIndex ? 'bg-white shadow-xs' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* In-Card Photo Navigation */}
                <div 
                  onClick={handlePrevPhoto} 
                  className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
                  title="Previous photo"
                />
                <div 
                  onClick={handleNextPhoto} 
                  className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
                  title="Next photo"
                />

                {/* Floating Chevron Buttons */}
                {currentPhotoIndex > 0 && (
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center font-bold text-sm backdrop-blur-xs transition-transform hover:scale-110 cursor-pointer"
                  >
                    ‹
                  </button>
                )}
                {currentPhotoIndex < userPhotos.length - 1 && (
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center font-bold text-sm backdrop-blur-xs transition-transform hover:scale-110 cursor-pointer"
                  >
                    ›
                  </button>
                )}

                {/* Card Gradient & Info Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/60 to-transparent p-5 pt-16 text-white z-25 pointer-events-none">
                  
                  {/* Status Tag */}
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-emerald-400 shadow-xs"></span>
                    <span>Recently Active</span>
                  </div>

                  {/* Name & Age Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md">
                        {currentUser?.firstName}
                      </h2>
                      <span className="text-2xl sm:text-3xl font-bold text-white/90">
                        {currentUser?.age || 22}
                      </span>
                      {currentUser?.isVerified && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold shadow-xs">
                          ✓
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(!isProfileExpanded);
                      }}
                      className="pointer-events-auto w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xs flex items-center justify-center text-white text-sm font-bold transition-transform hover:scale-110 cursor-pointer"
                    >
                      {isProfileExpanded ? '↓' : '↑'}
                    </button>
                  </div>

                  {/* Location */}
                  <div className="space-y-0.5 mt-1 text-xs text-gray-300 font-medium">
                    <p className="flex items-center space-x-1">
                      <span>📍</span>
                      <span>{currentUser?.location || '35 kilometers away'}</span>
                    </p>
                  </div>

                  {/* Expanded Profile Info */}
                  {isProfileExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/20 space-y-2 animate-in fade-in max-h-32 overflow-y-auto">
                      {currentUser?.bio && (
                        <p className="text-xs text-gray-200 leading-relaxed">{currentUser.bio}</p>
                      )}
                      {currentUser?.interests?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {currentUser.interests.map((t, i) => (
                            <span key={i} className="border border-white/30 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
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


            {/* 5 GAMEPAD ACTION BUTTONS (Exact Match to Picture 2) */}
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


            {/* KEYBOARD SHORTCUTS LEGEND */}
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
        ) : (
          <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-sm">
            <h3 className="text-xl font-black text-gray-900 mb-2">No matching profiles found</h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              We couldn't find any active profiles in this category matching your sexual/dating interest. Try other categories or update your discovery preferences.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSelectCategory('long-term')}
                className="bg-black hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-full text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Explore All Goals
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-full text-xs transition-transform cursor-pointer"
              >
                Dating Preferences
              </button>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};

export default Explore;
