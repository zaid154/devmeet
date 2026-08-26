import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FlameIcon } from '../components/Icons';
import { BASE_URL } from '../utils/constants';

const Onboarding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const fileInputRef = useRef(null);

  const prefill = location.state || {};

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(prefill.prefillEmail || '');
  const [phone, setPhone] = useState(prefill.prefillPhone || '');
  
  // Birthday inputs (Month MM, Day DD, Year YYYY)
  const [birthMonth, setBirthMonth] = useState('07');
  const [birthDay, setBirthDay] = useState('10');
  const [birthYear, setBirthYear] = useState('2005');

  // Gender & Interested In
  const [gender, setGender] = useState('man');
  const [showGenderOnProfile, setShowGenderOnProfile] = useState(true);
  const [interestedIn, setInterestedIn] = useState('women');

  // Relationship Goal
  const [relationshipGoal, setRelationshipGoal] = useState('long-term');
  const [showIntentModal, setShowIntentModal] = useState(false);

  // Interests / Tech stack (Max 5)
  const [interests, setInterests] = useState(['Sci-Fi', 'Marvel', 'Harry Potter']);
  const [tempInterests, setTempInterests] = useState(['Sci-Fi', 'Marvel', 'Harry Potter']);
  const [showInterestsModal, setShowInterestsModal] = useState(false);

  // Sexual orientation
  const [sexualOrientation, setSexualOrientation] = useState('');
  const [showOrientationModal, setShowOrientationModal] = useState(false);

  // 6 Photos slots (all empty by default for user upload)
  const [photos, setPhotos] = useState(['', '', '', '', '', '']);
  const [activePhotoSlot, setActivePhotoSlot] = useState(null);
  const [adjustingPhoto, setAdjustingPhoto] = useState(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoRotation, setPhotoRotation] = useState(0);

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allAvailableInterests = [
    '90s Kid', 'Harry Potter', 'SoundCloud', 'Spa', 'Self Care', 'Heavy Metal', 'House Parties',
    'Gymnastics', 'Ludo', 'Maggi', 'Documentaries', 'Biryani', 'Drama shows', 'Meditation',
    'Foodie', 'Sushi', 'Spotify', 'Hockey', 'Basketball', 'Fantasy movies', 'Home Workout',
    'Theater', 'Cafe hopping', 'Sneakers', 'Aquarium', 'Instagram', 'Hot Springs', 'Walking',
    'Running', 'Travel', 'Language Exchange', 'Movies', 'Action movies', 'Animated movies',
    'Crime shows', 'Social Development', 'Gym', 'Social Media', 'Soul music', 'Hip Hop',
    'Skincare', 'Musical theater', 'J-Pop', 'Cricket', 'Shisha', 'Freelancing', 'K-Pop',
    'Skateboarding', 'Sci-Fi', 'Marvel', 'React', 'Node.js', 'Python', 'TypeScript', 'Gaming'
  ];

  const relationshipIntents = [
    { key: 'long-term', label: 'Long-term partner', emoji: '💘' },
    { key: 'long-term-open', label: 'Long-term, open to short', emoji: '😍' },
    { key: 'short-term-open', label: 'Short-term, open to long', emoji: '🥂' },
    { key: 'short-term', label: 'Short-term fun', emoji: '🎉' },
    { key: 'new-friends', label: 'New friends', emoji: '👋' },
    { key: 'figuring-out', label: 'Still figuring it out', emoji: '🤔' }
  ];

  const orientations = [
    'Straight', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Demisexual', 'Pansexual', 'Queer'
  ];

  // Trigger file selection for slot
  const handleSlotClick = (idx) => {
    setActivePhotoSlot(idx);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        setAdjustingPhoto(loadEvt.target.result);
        setPhotoZoom(1);
        setPhotoRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmAdjustPhoto = () => {
    if (activePhotoSlot !== null && adjustingPhoto) {
      const updated = [...photos];
      updated[activePhotoSlot] = adjustingPhoto;
      setPhotos(updated);
      setAdjustingPhoto(null);
      setActivePhotoSlot(null);

      // Show toast
      setToastMessage('Your photo has successfully uploaded.');
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  const handleRemovePhoto = (idx, e) => {
    e.stopPropagation();
    const updated = [...photos];
    updated[idx] = '';
    setPhotos(updated);
  };

  const toggleInterest = (tag) => {
    if (tempInterests.includes(tag)) {
      setTempInterests(tempInterests.filter(i => i !== tag));
    } else {
      if (tempInterests.length < 5) {
        setTempInterests([...tempInterests, tag]);
      }
    }
  };

  const handleSaveInterests = () => {
    setInterests(tempInterests);
    setShowInterestsModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }

    const currentYear = new Date().getFullYear();
    const parsedYear = Number(birthYear);
    const age = parsedYear > 1900 ? Math.max(18, currentYear - parsedYear) : 21;

    const validPhotos = photos.filter(p => p && p.trim().length > 0);
    if (validPhotos.length === 0) {
      setError('Please upload at least 1 profile photo.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/onboarding`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        age,
        birthday: {
          month: birthMonth,
          day: birthDay,
          year: birthYear
        },
        gender: gender === 'man' ? 'male' : gender === 'woman' ? 'female' : 'other',
        interestedIn: interestedIn === 'men' ? 'male' : interestedIn === 'women' ? 'female' : 'everyone',
        relationshipGoal,
        interests,
        skills: interests.filter(i => ['React', 'Node.js', 'Python', 'TypeScript', 'Gaming'].includes(i)),
        photos: validPhotos,
        profileImage: validPhotos[0]
      }, { withCredentials: true });

      if (res.data.status) {
        if (res.data.data) {
          login(res.data.data);
        }
        navigate('/feed');
      } else {
        setError(res.data.message || 'Failed to complete profile creation');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error connecting to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col justify-between select-none relative">
      
      {/* Hidden File Input for photo uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/*"
        className="hidden"
      />

      {/* Top Success Toast Notification (Screenshot 4) */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#20262e] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-start space-x-3 max-w-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex-1 text-left">
            <h5 className="font-bold text-xs">Success!</h5>
            <p className="text-[11px] text-gray-300 mt-0.5">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage('')} className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Top Header Navbar */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-gray-100 py-3 sm:py-4 px-4 sm:px-8 lg:px-12 flex items-center justify-between select-none">
        <Link to="/" className="flex items-center space-x-1.5 group shrink-0">
          <div className="text-[#c8102e] transform group-hover:scale-105 transition-transform">
            <FlameIcon className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <span 
            className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900"
            style={{ fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            dev<span className="text-[#c8102e]">meet</span>
          </span>
        </Link>

        <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800 hover:text-black cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors shrink-0">
          <span className="text-sm">文A</span>
          <span className="hidden sm:inline">Language</span>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 overflow-x-hidden">
        
        {/* Page Title */}
        <h1 className="text-2xl sm:text-4xl font-black text-center text-gray-900 mb-6 sm:mb-10 tracking-tight">
          Create account
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl p-3.5 mb-6 text-center font-medium max-w-xl mx-auto">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 w-full">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 w-full">
            
            {/* ============================================================ */}
            {/* LEFT COLUMN: BASIC INFO */}
            {/* ============================================================ */}
            <div className="space-y-5 sm:space-y-6 text-left w-full min-w-0">
              
              {/* First Name */}
              <div className="w-full">
                <label className="block text-xs font-bold text-gray-900 mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-[#f0f2f5] focus:bg-white border-2 border-transparent focus:border-black rounded-2xl px-3.5 py-3 sm:py-3.5 text-sm text-gray-900 outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div className="w-full">
                <label className="block text-xs font-bold text-gray-900 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@example.com"
                  className="w-full bg-[#f0f2f5] focus:bg-white border-2 border-transparent focus:border-black rounded-2xl px-3.5 py-3 sm:py-3.5 text-sm text-gray-900 outline-none transition-all"
                />
              </div>

              {/* Birthday with Month / Day / Year Sub-Labels */}
              <div className="w-full">
                <label className="block text-xs font-bold text-gray-900 mb-1.5">
                  Birthday <span className="text-red-500">*</span>
                </label>
                
                <div className="space-y-1 w-full">
                  <div className="flex gap-2 text-[11px] sm:text-xs font-bold text-gray-700 text-center w-full">
                    <span className="flex-1">Month</span>
                    <span className="flex-1">Day</span>
                    <span className="flex-1">Year</span>
                  </div>

                  <div className="flex gap-2 w-full">
                    <input
                      type="text"
                      maxLength={2}
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="MM"
                      className="flex-1 min-w-0 bg-[#f0f2f5] focus:bg-white border-2 border-transparent focus:border-black rounded-2xl py-3 px-1 text-sm text-center font-bold text-gray-900 outline-none transition-all"
                    />
                    <input
                      type="text"
                      maxLength={2}
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="DD"
                      className="flex-1 min-w-0 bg-[#f0f2f5] focus:bg-white border-2 border-transparent focus:border-black rounded-2xl py-3 px-1 text-sm text-center font-bold text-gray-900 outline-none transition-all"
                    />
                    <input
                      type="text"
                      maxLength={4}
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="YYYY"
                      className="flex-1 min-w-0 bg-[#f0f2f5] focus:bg-white border-2 border-transparent focus:border-black rounded-2xl py-3 px-1 text-sm text-center font-bold text-gray-900 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Gender (Red Border on Active Pill) */}
              <div className="w-full">
                <label className="block text-xs font-bold text-gray-900 mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 w-full">
                  {['man', 'woman', 'more'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 min-w-0 py-3 px-1 rounded-full text-xs font-bold border-2 transition-all cursor-pointer capitalize text-center ${
                        gender === g
                          ? 'border-[#fe3c72] text-gray-900 bg-white shadow-2xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {g === 'more' ? 'More >' : g}
                    </button>
                  ))}
                </div>

                {/* Show Gender Checkbox (Red Checkbox when active) */}
                <label className="flex items-center space-x-2.5 mt-2.5 text-xs font-medium text-gray-700 cursor-pointer select-none">
                  <div
                    onClick={() => setShowGenderOnProfile(!showGenderOnProfile)}
                    className={`w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-colors ${
                      showGenderOnProfile ? 'bg-[#fe3c72] text-white' : 'border border-gray-300 bg-white'
                    }`}
                  >
                    {showGenderOnProfile && <span className="text-[10px] font-black">✓</span>}
                  </div>
                  <span>Show my gender on my profile</span>
                </label>
              </div>

              {/* Interested In (Red Border on Active Pill) */}
              <div className="w-full">
                <label className="block text-xs font-bold text-gray-900 mb-1.5">
                  Interested in <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 w-full">
                  {['men', 'women', 'everyone'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setInterestedIn(opt)}
                      className={`flex-1 min-w-0 py-3 px-1 rounded-full text-xs font-bold border-2 transition-all cursor-pointer capitalize text-center ${
                        interestedIn === opt
                          ? 'border-[#fe3c72] text-gray-900 bg-white shadow-2xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Looking for (Edit button & Red Pill, Screenshot 2) */}
              <div className="w-full">
                <label className="block text-xs font-bold text-gray-900 mb-1.5">
                  Looking for <span className="text-red-500">*</span>
                </label>
                
                {relationshipGoal ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowIntentModal(true)}
                      className="bg-white hover:bg-gray-50 border border-gray-300 rounded-full px-4 py-2 text-xs font-bold text-gray-800 flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>✏</span>
                      <span>Edit Relationship Intent</span>
                    </button>

                    <div>
                      <span className="border-2 border-[#fe3c72] bg-white text-gray-900 font-bold px-3.5 py-1.5 rounded-full inline-flex items-center space-x-1.5 text-xs shadow-2xs">
                        <span>{relationshipIntents.find(r => r.key === relationshipGoal)?.emoji || '💘'}</span>
                        <span>{relationshipIntents.find(r => r.key === relationshipGoal)?.label || relationshipGoal}</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowIntentModal(true)}
                    className="bg-white hover:bg-gray-50 border border-gray-300 rounded-full px-5 py-2.5 text-xs font-bold text-gray-800 flex items-center space-x-2 cursor-pointer transition-colors shadow-2xs"
                  >
                    <span className="text-base leading-none">+</span>
                    <span>Add Relationship Intent</span>
                  </button>
                )}
              </div>

            </div>


            {/* ============================================================ */}
            {/* RIGHT COLUMN: 6 PROFILE PHOTOS GRID */}
            {/* ============================================================ */}
            <div className="space-y-3.5 sm:space-y-4 text-left w-full min-w-0">
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1.5">
                  Profile photos <span className="text-red-500">*</span>
                </label>
              </div>

              {/* 6 Photo Slots (2 rows x 3 columns) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                {photos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSlotClick(idx)}
                    className={`w-full min-w-0 aspect-3/4 rounded-2xl relative border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden group ${
                      photoUrl
                        ? 'border-transparent bg-gray-100 shadow-xs'
                        : 'border-gray-300 hover:border-gray-500 bg-[#fafafa]'
                    }`}
                  >
                    {photoUrl ? (
                      <>
                        <img
                          src={photoUrl}
                          alt={`Slot ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Remove Cross Button in Bottom-Right */}
                        <button
                          type="button"
                          onClick={(e) => handleRemovePhoto(idx, e)}
                          className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-white/90 hover:bg-white text-gray-800 border border-gray-300 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold cursor-pointer transition-colors shadow"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      /* Circular Black Plus Button */
                      <div className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md group-hover:scale-110 transition-transform">
                        +
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Explanatory Captions */}
              <div className="space-y-1 pt-1">
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                  Hold, drag and drop or press Space bar and Arrow keys to reorder your photos
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                  Upload 2 photos to start. Add 4 or more to make your profile stand out.
                </p>
              </div>

            </div>

          </div>


          {/* ============================================================ */}
          {/* OPTIONAL SECTION (Divider + Interests & Sexual Orientation) */}
          {/* ============================================================ */}
          <div className="pt-6">
            
            {/* Centered Optional Divider */}
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-xs font-bold text-gray-800">Optional</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div className="space-y-5 text-left max-w-xl">
              
              {/* Interests (Screenshot 2) */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-2">Interests</label>
                
                {interests.length > 0 ? (
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTempInterests([...interests]);
                        setShowInterestsModal(true);
                      }}
                      className="bg-white hover:bg-gray-50 border border-gray-300 rounded-full px-5 py-2 text-xs font-bold text-gray-800 flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>✏</span>
                      <span>Edit Interests</span>
                    </button>

                    <div className="flex flex-wrap gap-2">
                      {interests.map((tag, idx) => (
                        <span key={idx} className="border-2 border-[#fe3c72] bg-white text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-2xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTempInterests([]);
                      setShowInterestsModal(true);
                    }}
                    className="bg-white hover:bg-gray-50 border border-gray-300 rounded-full px-6 py-3 text-xs font-bold text-gray-800 flex items-center space-x-2 cursor-pointer transition-colors shadow-2xs"
                  >
                    <span className="text-base leading-none">+</span>
                    <span>Add Interests</span>
                  </button>
                )}
              </div>

              {/* Sexual Orientation */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-2">Sexual Orientation</label>
                <button
                  type="button"
                  onClick={() => setShowOrientationModal(true)}
                  className="bg-white hover:bg-gray-50 border border-gray-300 rounded-full px-6 py-3 text-xs font-bold text-gray-800 flex items-center space-x-2 cursor-pointer transition-colors shadow-2xs"
                >
                  <span className="text-base leading-none">+</span>
                  <span>{sexualOrientation || 'Add Sexual Orientation'}</span>
                </button>
              </div>

            </div>

          </div>


          {/* ============================================================ */}
          {/* SUBMIT BUTTON & LOGIN LINK (Matching Screenshot 3) */}
          {/* ============================================================ */}
          <div className="pt-8 text-center space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-black hover:bg-gray-900 text-white font-bold py-4 px-20 rounded-full text-base shadow-md cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              {loading ? 'Creating Account...' : 'Continue'}
            </button>

            <div>
              <Link to="/login" className="text-xs font-bold text-[#1877F2] hover:underline">
                Already have an account? Log in.
              </Link>
            </div>
          </div>

        </form>

      </main>


      {/* ============================================================ */}
      {/* ADJUST PHOTO MODAL (Screenshot 3) */}
      {/* ============================================================ */}
      {adjustingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans select-none">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full space-y-5 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-gray-900">
              Adjust Photo
            </h3>

            {/* Photo Crop Box with 3x3 Grid Lines */}
            <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              <div 
                className="w-full h-full flex items-center justify-center overflow-hidden"
                style={{
                  transform: `scale(${photoZoom}) rotate(${photoRotation}deg)`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                <img
                  src={adjustingPhoto}
                  alt="Adjust Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 3x3 Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/40">
                <div className="border-r border-b border-white/40"></div>
                <div className="border-r border-b border-white/40"></div>
                <div className="border-b border-white/40"></div>
                <div className="border-r border-b border-white/40"></div>
                <div className="border-r border-b border-white/40"></div>
                <div className="border-b border-white/40"></div>
                <div className="border-r border-white/40"></div>
                <div className="border-r border-white/40"></div>
                <div></div>
              </div>
            </div>

            {/* Zoom Slider & Rotate */}
            <div className="flex items-center justify-center space-x-3 px-4">
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={photoZoom}
                onChange={(e) => setPhotoZoom(parseFloat(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setPhotoRotation((photoRotation + 90) % 360)}
                className="text-gray-600 hover:text-black p-1 text-sm font-bold cursor-pointer"
                title="Rotate 90°"
              >
                🔄
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmAdjustPhoto}
                className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3.5 rounded-full text-sm shadow-md cursor-pointer transition-all"
              >
                Choose
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdjustingPhoto(null);
                  setActivePhotoSlot(null);
                }}
                className="w-full text-gray-800 hover:text-black font-bold py-2 text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ============================================================ */}
      {/* "WHAT ARE YOU INTO?" INTERESTS MODAL (Screenshot 1) */}
      {/* ============================================================ */}
      {showInterestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans select-none">
          <div className="bg-white rounded-3xl p-7 max-w-lg w-full space-y-4 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 relative max-h-[90vh] flex flex-col justify-between">
            
            {/* Close */}
            <button 
              onClick={() => setShowInterestsModal(false)} 
              className="absolute top-5 right-5 text-gray-400 hover:text-black font-bold text-sm cursor-pointer p-1"
            >
              ✕
            </button>

            <div>
              <h3 className="font-extrabold text-2xl text-gray-900 tracking-tight">
                What are you into?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                You like what you like. Now, let everyone know.
              </p>
            </div>

            {/* Chips Cloud */}
            <div className="flex flex-wrap justify-center gap-2 max-h-[50vh] overflow-y-auto py-3 px-1 scrollbar">
              {allAvailableInterests.map((tag) => {
                const isSelected = tempInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#fe3c72] text-[#fe3c72] bg-white font-bold shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Bottom Save Button (Save (X/5)) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveInterests}
                className="w-full max-w-xs mx-auto bg-black hover:bg-gray-900 text-white font-bold py-3.5 rounded-full text-sm shadow-md cursor-pointer transition-all"
              >
                Save ({tempInterests.length}/5)
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ============================================================ */}
      {/* RELATIONSHIP INTENT MODAL */}
      {/* ============================================================ */}
      {showIntentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans select-none">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full space-y-3 shadow-2xl border border-gray-100 text-left animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">What are you looking for?</h3>
              <button onClick={() => setShowIntentModal(false)} className="text-gray-400 hover:text-black font-bold">✕</button>
            </div>

            <div className="space-y-2 pt-1">
              {relationshipIntents.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setRelationshipGoal(item.key);
                    setShowIntentModal(false);
                  }}
                  className={`w-full p-3.5 rounded-2xl border-2 text-xs font-bold text-left flex items-center space-x-3 transition-all cursor-pointer ${
                    relationshipGoal === item.key
                      ? 'border-[#fe3c72] text-gray-900 bg-white shadow-xs'
                      : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ============================================================ */}
      {/* SEXUAL ORIENTATION MODAL */}
      {/* ============================================================ */}
      {showOrientationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans select-none">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full space-y-3 shadow-2xl border border-gray-100 text-left animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Sexual Orientation</h3>
              <button onClick={() => setShowOrientationModal(false)} className="text-gray-400 hover:text-black font-bold">✕</button>
            </div>

            <div className="space-y-1.5 pt-1">
              {orientations.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSexualOrientation(item);
                    setShowOrientationModal(false);
                  }}
                  className={`w-full p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                    sexualOrientation === item
                      ? 'border-[#fe3c72] text-[#fe3c72] font-bold bg-white'
                      : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>{item}</span>
                  {sexualOrientation === item && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Onboarding;
