import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldIcon, UserIcon } from '../components/Icons';
import { BASE_URL } from '../utils/constants';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-36 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xs border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          
          <div className="relative shrink-0">
            <img
              src={photos[0]}
              alt={profile?.firstName}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
            />
            {profile?.isVerified && (
              <span className="absolute -bottom-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-2xs" title="Verified Profile">
                ✓
              </span>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-3">
              <h1 className="text-2xl font-bold text-slate-900">{profile?.firstName} {profile?.lastName}</h1>
              <span className="text-base font-semibold text-slate-500">{profile?.age || 24}</span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {profile?.job || 'Software Engineer'} &bull; {profile?.location || 'Remote'}
            </p>

            {/* Profile Completeness Meter */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 mb-1">
                <span>Profile Completeness</span>
                <span className="text-slate-900 font-bold">{score}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#fe3c72] h-full rounded-full transition-all duration-500"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {/* Edit & Settings Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                to="/profile/edit"
                className="bg-[#fe3c72] hover:bg-[#e03463] text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-2xs transition-all"
              >
                Edit Profile
              </Link>
              <Link
                to="/settings"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-1.5 rounded-full transition-all border border-slate-200"
              >
                Settings
              </Link>
            </div>

          </div>
        </div>

        {/* Verification Status Card */}
        <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <ShieldIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">
                {profile?.isVerified ? 'Official Profile Verified' : profile?.verificationStatus === 'pending' ? 'Verification Request Under Review' : 'Profile Unverified'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {profile?.isVerified ? 'Your identity is confirmed with an official checkmark.' : profile?.verificationStatus === 'pending' ? 'Our moderation team is reviewing your verification application.' : 'Submit a verification request to receive an official badge.'}
              </div>
            </div>
          </div>

          {!profile?.isVerified && profile?.verificationStatus !== 'pending' && (
            <button
              onClick={() => setShowVerifyModal(true)}
              className="bg-slate-900 hover:bg-black text-white font-semibold text-xs px-4 py-2 rounded-full transition-all cursor-pointer shrink-0"
            >
              Get Verified
            </button>
          )}
        </div>

        {/* Photos Gallery */}
        <div className="bg-white rounded-2xl p-6 shadow-2xs border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Photo Gallery ({photos.length})</h3>
            <Link to="/profile/edit" className="text-xs font-semibold text-slate-700 hover:text-[#fe3c72]">Manage Photos →</Link>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {photos.map((p, idx) => (
              <img
                key={idx}
                src={p}
                alt="Profile snapshot"
                className="aspect-3/4 w-full object-cover rounded-xl border border-slate-200"
              />
            ))}
          </div>
        </div>

        {/* Bio & Details */}
        <div className="bg-white rounded-2xl p-6 shadow-2xs border border-slate-200 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">About</h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {profile?.bio || 'No bio added yet. Click edit profile to tell others about yourself.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {profile?.relationshipGoal && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Looking For</span>
                <span className="text-xs font-bold text-slate-900 capitalize">{profile.relationshipGoal.replace('-', ' ')}</span>
              </div>
            )}
            {profile?.zodiacSign && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Zodiac</span>
                <span className="text-xs font-bold text-slate-900 capitalize">{profile.zodiacSign}</span>
              </div>
            )}
          </div>

          {profile?.favoriteArtist && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Favorite Artist / Track</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {profile.favoriteArtist} {profile.favoriteSong ? `— "${profile.favoriteSong}"` : ''}
              </p>
            </div>
          )}

          {profile?.skills?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile?.interests?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Interests</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((i, idx) => (
                  <span key={idx} className="bg-red-50 text-red-700 border border-red-100 text-xs font-semibold px-2.5 py-1 rounded-lg">
                    #{i}
                  </span>
                ))}
              </div>
            </div>
          )}
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
