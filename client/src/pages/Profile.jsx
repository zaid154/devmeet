import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BASE_URL } from '../utils/constants';

const Profile = () => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/profile`, { withCredentials: true });
      if (res.data.status && res.data.data) {
        setProfile(res.data.data);
        updateUser(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <div className="w-9 h-9 border-3 border-[#fe3c72] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const photos = profile?.photos?.length
    ? profile.photos
    : [profile?.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80'];

  const defaultSkills = ['React.js', 'Node.js', 'MongoDB', 'TypeScript', 'TailwindCSS', 'AI / LLM', 'Next.js', 'Express'];
  const skillsList = profile?.skills?.length ? profile.skills : defaultSkills;

  const defaultInterests = ['Coding', 'Tech Startups', 'Hackathons', 'Fitness', 'Coffee', 'Travel', 'Open Source'];
  const interestsList = profile?.interests?.length ? profile.interests : defaultInterests;

  return (
    <div className="min-h-screen bg-[#07090e] text-white pt-5 pb-24 px-4 sm:px-6 lg:px-10 font-sans select-none">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. TOP APP BAR */}
        <header className="flex items-center justify-between pb-3 border-b border-[#1c2230]">
          <button
            onClick={() => navigate('/feed')}
            className="flex items-center space-x-2 text-xs font-bold text-gray-300 hover:text-white transition-all bg-[#121622] hover:bg-[#1c2234] px-4 py-2 rounded-full border border-[#252e42] cursor-pointer shadow-xs"
          >
            <span>←</span>
            <span>Back to Radar</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-black text-white tracking-wider uppercase">
              Dev<span className="text-[#fe3c72]">Meet</span> Profile
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-[#121622] hover:bg-[#1c2234] text-gray-300 flex items-center justify-center text-xs font-bold border border-[#252e42] cursor-pointer transition-colors"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={logout}
              className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 px-3.5 py-2 rounded-full border border-red-800/50 transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </header>

        {/* 2. RESPONSIVE TWO-COLUMN GRID LAYOUT (Laptop 2-Col, Mobile 1-Col) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ============================================================ */}
          {/* LEFT COLUMN: HERO AVATAR, IDENTITY & MEMBERSHIP (5 Cols on Laptop) */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">
            
            {/* Main Identity Card */}
            <div className="relative overflow-hidden bg-gradient-to-b from-[#141926] to-[#0e121c] p-6 sm:p-7 rounded-3xl border border-[#232b3e] shadow-2xl space-y-5 text-center">
              {/* Ambient Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#fe3c72]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Large Avatar */}
              <div className="relative inline-block mx-auto">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 bg-gradient-to-tr from-[#fe3c72] via-pink-500 to-amber-400 shadow-2xl mx-auto">
                  <img
                    src={photos[0]}
                    alt={profile?.firstName}
                    className="w-full h-full rounded-full object-cover aspect-square"
                  />
                </div>
                <span className="absolute bottom-1 right-2 w-5 h-5 bg-emerald-500 border-3 border-[#0e121c] rounded-full shadow-md" title="Online now" />
              </div>

              {/* Name & Title */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {profile?.firstName} {profile?.lastName}
                  </h1>
                  {profile?.isVerified && (
                    <span className="w-5 h-5 rounded-full bg-[#1d9bf0] text-white flex items-center justify-center text-xs font-black shadow-xs" title="Verified Profile">
                      ✓
                    </span>
                  )}
                  {profile?.role === 'super-admin' && (
                    <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      Founder
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold text-gray-300">
                  {profile?.job || 'Lead Full-Stack Developer'} &bull; {profile?.age || 24} yrs
                </p>

                <p className="text-xs text-gray-400 flex items-center justify-center space-x-1">
                  <span>📍</span>
                  <span>{profile?.location || 'New Delhi, India'}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <Link
                  to="/profile/edit"
                  className="bg-gradient-to-r from-[#fe3c72] to-[#ff655b] hover:opacity-95 text-white text-xs font-bold py-2.5 px-4 rounded-full shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>✏️</span>
                  <span>Edit Profile</span>
                </Link>
                <button
                  onClick={() => navigate('/feed?open=settings')}
                  className="bg-[#1c2232] hover:bg-[#252e42] text-gray-200 text-xs font-bold py-2.5 px-4 rounded-full border border-[#2e3952] transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>⚙️</span>
                  <span>Preferences</span>
                </button>
              </div>

              {/* Key Stats Metric Grid */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[#1f2637] text-center">
                <div className="bg-[#0b0e16]/70 p-2.5 rounded-2xl border border-[#1f2637]">
                  <span className="block text-sm font-black text-white">100%</span>
                  <span className="text-[10px] text-gray-400 font-medium">Profile</span>
                </div>
                <div className="bg-[#0b0e16]/70 p-2.5 rounded-2xl border border-[#1f2637]">
                  <span className="block text-sm font-black text-[#fe3c72]">12</span>
                  <span className="text-[10px] text-gray-400 font-medium">Matches</span>
                </div>
                <div className="bg-[#0b0e16]/70 p-2.5 rounded-2xl border border-[#1f2637]">
                  <span className="block text-sm font-black text-amber-400">5</span>
                  <span className="text-[10px] text-gray-400 font-medium">Super Likes</span>
                </div>
                <div className="bg-[#0b0e16]/70 p-2.5 rounded-2xl border border-[#1f2637]">
                  <span className="block text-sm font-black text-emerald-400">Active</span>
                  <span className="text-[10px] text-gray-400 font-medium">Status</span>
                </div>
              </div>
            </div>

            {/* VIP Platinum Membership Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-yellow-600/15 to-amber-500/20 p-5 sm:p-6 rounded-3xl border border-amber-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-2xl">👑</span>
                  <div>
                    <h3 className="font-black text-sm text-amber-400 tracking-wider uppercase">DEVMEET VIP PLATINUM</h3>
                    <p className="text-[10px] text-amber-200/80">Active VIP Member Status</p>
                  </div>
                </div>
                <span className="bg-amber-400 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Active ✓
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 pt-1">
                <div className="flex items-center space-x-1.5">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Priority Radar Feed</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>See Who Liked You</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Unlimited Swipes</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Incognito Mode</span>
                </div>
              </div>
            </div>

          </div>


          {/* ============================================================ */}
          {/* RIGHT COLUMN: BIO, TECH STACK, PHOTOS GALLERY (7 Cols on Laptop) */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 space-y-5">

            {/* About Me & Story Card */}
            <div className="bg-[#0e121c] p-6 rounded-3xl border border-[#1e2536] shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>💬</span>
                  <span>About Me</span>
                </h3>
                <span className="bg-[#1c2232] text-[#fe3c72] text-[11px] font-bold px-3 py-1 rounded-full border border-[#2d3750]">
                  💘 Long-term partner
                </span>
              </div>

              <p className="text-sm text-gray-200 leading-relaxed font-normal italic border-l-3 border-[#fe3c72] pl-3.5">
                "{profile?.bio || 'Full-stack developer building scalable MERN & AI architectures. Tech enthusiast, coffee lover, and open-source contributor. Always excited to meet fellow passionate builders! 🚀💻☕'}"
              </p>
            </div>

            {/* Tech Stack & Skills Cloud */}
            <div className="bg-[#0e121c] p-6 rounded-3xl border border-[#1e2536] shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span>💻</span>
                <span>Tech Stack & Interests</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 block mb-2">Core Technologies:</span>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill, i) => (
                      <span
                        key={i}
                        className="bg-[#151a26] text-gray-200 text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-[#263044] hover:border-pink-500/50 hover:bg-[#1a2130] transition-colors"
                      >
                        ⚡ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1a202e]">
                  <span className="text-[11px] font-bold text-gray-400 block mb-2">Passions & Hobbies:</span>
                  <div className="flex flex-wrap gap-2">
                    {interestsList.map((interest, i) => (
                      <span
                        key={`int-${i}`}
                        className="bg-[#151a26] text-gray-300 text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-[#263044]"
                      >
                        🎯 {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Photos Gallery Grid */}
            <div className="bg-[#0e121c] p-6 rounded-3xl border border-[#1e2536] shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>📷</span>
                  <span>Photos Showcase ({photos.length})</span>
                </h3>
                <Link to="/profile/edit" className="text-xs font-bold text-[#fe3c72] hover:underline">
                  Manage Photos &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((photoUrl, idx) => (
                  <div key={idx} className="relative aspect-3/4 rounded-2xl overflow-hidden border border-[#202738] group shadow-sm bg-[#151a26]">
                    <img
                      src={photoUrl}
                      alt={`Snapshot ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
