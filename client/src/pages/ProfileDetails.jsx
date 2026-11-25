import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { HeartIcon, CrossIcon, CloseIcon } from '../components/Icons';
import { BASE_URL } from '../utils/constants';

const ProfileDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  
  // Report Modal
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('fake-profile');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/user-profile/${id}`, { withCredentials: true });
      if (res.data.status) {
        setProfile(res.data.data);
      } else {
        setError(res.data.message || 'Profile not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status) => {
    try {
      if (status === 'super-like') {
        await axios.post(`${BASE_URL}/super-like/${id}`, {}, { withCredentials: true });
      } else {
        await axios.post(`${BASE_URL}/sendConnection/${id}/${status}`, {}, { withCredentials: true });
      }
      navigate('/feed');
    } catch (e) {
      console.error(e);
      navigate('/feed');
    }
  };

  const handleBlock = async () => {
    if (window.confirm(`Are you sure you want to block ${profile.firstName}? You won't see them again.`)) {
      try {
        await axios.post(`${BASE_URL}/block/${id}`, {}, { withCredentials: true });
        navigate('/feed');
      } catch (e) {
        alert('Failed to block user');
      }
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/report/${id}`, {
        reason: reportReason,
        description: reportDesc
      }, { withCredentials: true });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReport(false);
        setReportSuccess(false);
      }, 1500);
    } catch (e) {
      alert('Failed to submit report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#fe3c72] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-sm font-bold text-red-500 mb-4">{error || 'Profile not found'}</p>
        <Link to="/feed" className="bg-black text-white text-xs font-bold px-6 py-2.5 rounded-full">
          Back to Discover
        </Link>
      </div>
    );
  }

  const allPhotos = profile.photos?.length ? profile.photos : [profile.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-20 pb-24 px-4 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
        
        {/* Top Floating Close Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-20 bg-black/60 hover:bg-black text-white p-2.5 rounded-full transition-colors backdrop-blur-xs"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        {/* Photos Carousel */}
        <div className="relative h-[440px] sm:h-[500px] w-full bg-gray-900 overflow-hidden">
          <img
            src={allPhotos[activePhotoIdx]}
            alt={profile.firstName}
            className="w-full h-full object-cover object-center transition-all duration-300"
          />

          {/* Photo Story Indicators */}
          {allPhotos.length > 1 && (
            <div className="absolute top-3 left-4 right-4 z-10 flex space-x-1.5">
              {allPhotos.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`h-1 flex-1 rounded-full cursor-pointer transition-all ${
                    idx === activePhotoIdx ? 'bg-white shadow-xs' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Left/Right Click Nav */}
          {allPhotos.length > 1 && (
            <>
              <div
                onClick={() => setActivePhotoIdx(prev => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
                className="absolute inset-y-0 left-0 w-1/3 cursor-pointer z-10"
              />
              <div
                onClick={() => setActivePhotoIdx(prev => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
                className="absolute inset-y-0 right-0 w-1/3 cursor-pointer z-10"
              />
            </>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

          {/* Profile Name Overlay */}
          <div className="absolute bottom-5 left-6 right-6 text-white pointer-events-none">
            <div className="flex items-baseline space-x-3">
              <h1 className="text-3xl sm:text-4xl font-black">{profile.firstName} {profile.lastName}</h1>
              <span className="text-2xl font-bold opacity-90">{profile.age || 24}</span>
              {profile.isVerified && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">✓ Verified</span>
              )}
            </div>
            {profile.location && (
              <p className="text-xs text-gray-200 mt-1 font-semibold flex items-center">
                📍 {profile.location}
              </p>
            )}
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Bio */}
          {profile.bio ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">About</h3>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">{profile.bio}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No bio written yet.</p>
          )}

          {/* Quick Badges: Goal, Zodiac, Music */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {profile.relationshipGoal && (
              <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                <span className="text-xs text-gray-400 font-bold block">Looking For</span>
                <span className="text-xs font-bold text-[#fe3c72] capitalize">{profile.relationshipGoal.replace('-', ' ')}</span>
              </div>
            )}

            {profile.zodiacSign && (
              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100">
                <span className="text-xs text-gray-400 font-bold block">Zodiac Sign</span>
                <span className="text-xs font-bold text-purple-600 capitalize">✨ {profile.zodiacSign}</span>
              </div>
            )}

            {profile.favoriteArtist && (
              <div className="bg-pink-50 p-3 rounded-2xl border border-pink-100">
                <span className="text-xs text-gray-400 font-bold block">Favorite Music</span>
                <span className="text-xs font-bold text-pink-600 truncate block">🎧 {profile.favoriteArtist}</span>
              </div>
            )}
          </div>

          {/* Job & Education */}
          {(profile.job || profile.education) && (
            <div className="space-y-2 py-2 border-y border-gray-100 text-xs font-semibold text-gray-600">
              {profile.job && <p>💼 Works as <strong className="text-gray-900">{profile.job}</strong></p>}
              {profile.education && <p>🎓 Studied at <strong className="text-gray-900">{profile.education}</strong></p>}
            </div>
          )}

          {/* Tech Stack & Interests */}
          {profile.skills?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Tech Stack & Interests</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                    {s}
                  </span>
                ))}
                {profile.interests?.map((i, idx) => (
                  <span key={`i-${idx}`} className="bg-red-50 text-[#fe3c72] border border-red-100 text-xs font-bold px-3 py-1.5 rounded-xl">
                    #{i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Safety: Block & Report */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-400">
            <button onClick={() => setShowReport(true)} className="hover:text-red-500 cursor-pointer">
              🚩 Report {profile.firstName}
            </button>
            <button onClick={handleBlock} className="hover:text-red-500 cursor-pointer">
              🚫 Block {profile.firstName}
            </button>
          </div>

        </div>

        {/* Floating Bottom Action Bar */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-gray-100 p-4 flex items-center justify-center space-x-6 z-20">
          <button
            onClick={() => handleAction('ignore')}
            className="w-14 h-14 rounded-full bg-white border-2 border-red-200 text-red-500 flex items-center justify-center shadow-lg hover:bg-red-50 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Pass"
          >
            <CrossIcon className="w-6 h-6" />
          </button>

          <button
            onClick={() => handleAction('super-like')}
            className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer text-xl"
            title="Super Like"
          >
            ⭐
          </button>

          <button
            onClick={() => handleAction('intrested')}
            className="w-16 h-16 rounded-full bg-[#fe3c72] text-white flex items-center justify-center shadow-xl hover:bg-[#e03463] hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Like"
          >
            <HeartIcon className="w-8 h-8" />
          </button>
        </div>

      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base">Report {profile.firstName}</h3>
              <button onClick={() => setShowReport(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {reportSuccess ? (
              <p className="text-xs font-bold text-emerald-600 text-center py-4">Report submitted. Thank you for keeping DevMeet safe.</p>
            ) : (
              <form onSubmit={handleReport} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none font-medium"
                  >
                    <option value="fake-profile">Fake Profile</option>
                    <option value="spam">Spam / Bot</option>
                    <option value="harassment">Harassment / Abusive</option>
                    <option value="inappropriate-content">Inappropriate Content</option>
                    <option value="scam">Scam / Commercial</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Details (Optional)</label>
                  <textarea
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    rows="3"
                    placeholder="Describe what happened..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 text-white font-bold py-2.5 rounded-full hover:bg-red-700 transition-colors"
                >
                  Submit Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDetails;
