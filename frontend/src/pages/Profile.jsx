import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldIcon, UserIcon } from '../components/Icons';
import { BASE_URL } from '../utils/constants';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user);

  // Verification request modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyDoc, setVerifyDoc] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/profile`, { withCredentials: true });
      if (res.data.status) {
        setProfile(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async (e) => {
    e.preventDefault();
    setVerifyLoading(true);
    setVerifyMsg('');
    try {
      const res = await axios.post(
        `${BASE_URL}/verification/request`,
        { documentUrl: verifyDoc || profile?.profileImage },
        { withCredentials: true }
      );
      if (res.data.status) {
        setVerifyMsg('Verification request submitted successfully. An administrator will review your account.');
        setProfile(prev => ({ ...prev, verificationStatus: 'pending' }));
        updateUser({ verificationStatus: 'pending' });
        setTimeout(() => setShowVerifyModal(false), 2000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit verification request');
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const photos = profile?.photos?.length ? profile.photos : [profile?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'];

  // Calculate profile completeness
  let score = 30;
  if (profile?.bio) score += 20;
  if (profile?.photos?.length > 1) score += 15;
  if (profile?.skills?.length > 0) score += 15;
  if (profile?.relationshipGoal) score += 10;
  if (profile?.favoriteArtist) score += 10;

  return (
    <div className="min-h-screen bg-[#000000] text-white pt-6 pb-28 px-4 sm:px-6 lg:px-8 font-sans select-none">
      <div className="max-w-md mx-auto space-y-5">
        
        {/* In-App Clean Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-[#202533]">
          <button
            onClick={() => navigate('/feed')}
            className="flex items-center space-x-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer bg-[#141822] hover:bg-[#1f2536] px-3 py-1.5 rounded-full border border-[#252c3d]"
          >
            <span>←</span>
            <span>Feed</span>
          </button>

          <span className="text-sm font-black text-white tracking-tight flex items-center space-x-1">
            <span className="text-[#fe3c72]">🔥</span>
            <span>My Profile</span>
          </span>

          <button
            onClick={logout}
            className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 px-3 py-1.5 rounded-full border border-red-800/60 transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>

        {/* Profile Card Header (Matching Video 0:48) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            {/* Avatar with Progress Ring */}
            <div className="relative w-16 h-16 rounded-full p-0.5 border-2 border-pink-500">
              <img
                src={photos[0]}
                alt={profile?.firstName}
                className="w-full h-full rounded-full object-cover"
              />
              <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-black">
                {score}%
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-xl font-black text-white">{profile?.firstName} {profile?.lastName}</h1>
                {profile?.isVerified && (
                  <span className="w-4 h-4 rounded-full bg-[#1d9bf0] text-white flex items-center justify-center text-[9px] font-black">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium">
                {profile?.job || 'Developer'} &bull; {profile?.age || 21}
              </p>
            </div>
          </div>

          {/* Action Buttons: Edit Profile, Theme Toggle & Settings Gear */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-[#1c202a] hover:bg-[#252b38] text-white flex items-center justify-center text-sm font-bold border border-[#2d3444] cursor-pointer transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <Link
              to="/profile/edit"
              className="bg-[#1c202a] hover:bg-[#252b38] text-white text-xs font-bold px-3.5 py-2 rounded-full border border-[#2d3444] transition-colors"
            >
              Edit profile
            </Link>
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 rounded-full bg-[#1c202a] hover:bg-[#252b38] text-gray-300 flex items-center justify-center text-sm font-bold border border-[#2d3444] cursor-pointer transition-colors"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Profile Completeness Bar */}
        <div className="bg-[#12151d] p-3.5 rounded-2xl border border-[#222838] space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold text-gray-400">
            <span>Complete your profile to be seen by more people!</span>
            <span className="text-pink-500">{score}%</span>
          </div>
          <div className="w-full bg-[#202533] h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-pink-500 h-full rounded-full" style={{ width: `${score}%` }} />
          </div>
        </div>

        {/* 3 Quick Profile Action Cards (Video 0:48) */}
        <div className="space-y-2">
          <Link
            to="/profile/edit"
            className="bg-[#12151d] hover:bg-[#181c26] p-3.5 rounded-2xl border border-[#222838] flex items-center justify-between transition-colors block"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">📷</span>
              <div>
                <h4 className="text-xs font-bold text-white">Add at least 4 photos</h4>
                <p className="text-[10px] text-gray-400">Get up to 2x more Likes with 6 pics.</p>
              </div>
            </div>
            <span className="text-gray-500 text-sm">›</span>
          </Link>

          <Link
            to="/profile/edit"
            className="bg-[#12151d] hover:bg-[#181c26] p-3.5 rounded-2xl border border-[#222838] flex items-center justify-between transition-colors block"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">✏️</span>
              <div>
                <h4 className="text-xs font-bold text-white">Add "About Me"</h4>
                <p className="text-[10px] text-gray-400">Get up to 25% more matches with an intro.</p>
              </div>
            </div>
            <span className="text-gray-500 text-sm">›</span>
          </Link>

          <Link
            to="/profile/edit"
            className="bg-[#12151d] hover:bg-[#181c26] p-3.5 rounded-2xl border border-[#222838] flex items-center justify-between transition-colors block"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">💬</span>
              <div>
                <h4 className="text-xs font-bold text-white">Add a prompt</h4>
                <p className="text-[10px] text-gray-400">Show off your personality to spark better conversations.</p>
              </div>
            </div>
            <span className="text-gray-500 text-sm">›</span>
          </Link>
        </div>

        {/* Boosts & Super Likes Row */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#12151d] p-3 rounded-2xl border border-[#222838] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-blue-400 text-base">⭐</span>
              <div>
                <h5 className="text-[11px] font-bold text-white">0 Super Likes</h5>
                <p className="text-[9px] text-gray-400">Get more</p>
              </div>
            </div>
            <span className="w-6 h-6 rounded-full bg-[#1e2330] text-white flex items-center justify-center text-xs font-bold">+</span>
          </div>

          <div className="bg-[#12151d] p-3 rounded-2xl border border-[#222838] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-purple-400 text-base">⚡</span>
              <div>
                <h5 className="text-[11px] font-bold text-white">My Boosts</h5>
                <p className="text-[9px] text-gray-400">Get more</p>
              </div>
            </div>
            <span className="w-6 h-6 rounded-full bg-[#1e2330] text-white flex items-center justify-center text-xs font-bold">+</span>
          </div>
        </div>

        {/* DEVMEET GOLD BANNER (Matching Video 0:50) */}
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-600/20 rounded-3xl p-5 border border-amber-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">👑</span>
              <h3 className="font-black text-base text-amber-400 tracking-wider">DEVMEET GOLD</h3>
            </div>
            <button className="bg-white text-black font-black text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md hover:scale-105 transition-transform cursor-pointer">
              Upgrade
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-300">
              <span>See Who Likes You</span>
              <span className="text-amber-400 font-bold">✓ Included</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Top Picks Daily</span>
              <span className="text-amber-400 font-bold">✓ Included</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Free Super Likes Weekly</span>
              <span className="text-amber-400 font-bold">✓ Included</span>
            </div>
          </div>
        </div>

        {/* Photo Gallery Grid */}
        <div className="bg-[#12151d] rounded-2xl p-4 border border-[#222838] space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Photos ({photos.length})</h3>
            <Link to="/profile/edit" className="text-xs font-bold text-[#fe3c72] hover:underline">Manage Photos →</Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, idx) => (
              <img
                key={idx}
                src={p}
                alt="Profile snapshot"
                className="aspect-3/4 w-full object-cover rounded-xl border border-[#222838]"
              />
            ))}
          </div>
        </div>

      </div>

      {/* Verification Request Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl p-7 max-w-md w-full space-y-4 shadow-xl animate-in zoom-in-95 border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Request Profile Verification
              </h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              To obtain the official blue checkmark badge, our moderation team manually reviews your profile photo against a verification image or developer ID URL.
            </p>

            {verifyMsg && (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl font-medium border border-emerald-200">
                {verifyMsg}
              </div>
            )}

            <form onSubmit={handleRequestVerification} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verification Document / Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={verifyDoc}
                  onChange={(e) => setVerifyDoc(e.target.value)}
                  placeholder="Paste URL or leave blank to use avatar photo"
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {verifyLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
