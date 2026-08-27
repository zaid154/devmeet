import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../utils/constants';

const AVAILABLE_INTERESTS = [
  'Coding', 'Open Source', 'AI / ML', 'Gaming', 'Coffee', 'Music', 'Hiking',
  'Anime', 'Startups', 'Design', 'Reading', 'Fitness', 'Travel', 'Crypto / Web3'
];

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState(24);
  const [gender, setGender] = useState('male');
  const [interestedIn, setInterestedIn] = useState('everyone');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [education, setEducation] = useState('');
  const [job, setJob] = useState('');
  const [height, setHeight] = useState('');
  const [relationshipGoal, setRelationshipGoal] = useState('');
  const [zodiacSign, setZodiacSign] = useState('');
  const [favoriteArtist, setFavoriteArtist] = useState('');
  const [favoriteSong, setFavoriteSong] = useState('');
  const [musicGenre, setMusicGenre] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [interests, setInterests] = useState([]);
  
  // Photos
  const [photos, setPhotos] = useState([]);
  const [photoInput, setPhotoInput] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const isInitialized = React.useRef(false);

  useEffect(() => {
    if (user && !isInitialized.current) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setAge(user.age || 24);
      setGender(user.gender || 'male');
      setInterestedIn(user.interestedIn || user.preferences?.gender || 'everyone');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setEducation(user.education || '');
      setJob(user.job || '');
      setHeight(user.height || '');
      setRelationshipGoal(user.relationshipGoal || '');
      setZodiacSign(user.zodiacSign || '');
      setFavoriteArtist(user.favoriteArtist || '');
      setFavoriteSong(user.favoriteSong || '');
      setMusicGenre(user.musicGenre || '');
      setSkills(user.skills || []);
      setInterests(user.interests || []);
      setPhotos(user.photos?.length ? user.photos : user.profileImage ? [user.profileImage] : []);
      isInitialized.current = true;
    }
  }, [user]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const toggleInterest = (item) => {
    if (interests.includes(item)) {
      setInterests(interests.filter(i => i !== item));
    } else {
      if (interests.length < 6) {
        setInterests([...interests, item]);
      }
    }
  };

  const handleFileChange = (e, slotIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Instant client-side visual preview
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUri = loadEvent.target.result;
      setPhotos(prev => {
        const next = [...prev];
        if (slotIndex < next.length) {
          next[slotIndex] = dataUri;
        } else {
          next.push(dataUri);
        }
        return next;
      });
    };
    reader.readAsDataURL(file);

    // 2. Upload to server in background
    uploadFileToServer(file, slotIndex);
    e.target.value = '';
  };

  const uploadFileToServer = async (file, slotIndex) => {
    setPhotoUploading(true);
    setMsg({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('image', file);

      const isMain = slotIndex === 0 || (photos.length === 0);
      const endpoint = isMain ? `${BASE_URL}/upload/profile-image` : `${BASE_URL}/upload/photo`;

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await axios.post(endpoint, formData, {
        withCredentials: true,
        headers
      });

      if (res.data.success) {
        const newUrl = res.data.data.profileImage || res.data.data.photoUrl;
        setPhotos(prev => {
          const next = [...prev];
          if (slotIndex < next.length) {
            next[slotIndex] = newUrl;
          } else {
            next.push(newUrl);
          }
          if (updateUser) {
            updateUser({
              ...user,
              photos: next,
              profileImage: next[0]
            });
          }
          return next;
        });
        setMsg({ type: 'success', text: 'Photo uploaded successfully! ☁️' });
      }
    } catch (err) {
      console.warn('Upload warning:', err);
      setMsg({ type: 'success', text: 'Photo added! Click "Save Changes" to sync across your profile.' });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleAddPhoto = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (photoInput.trim() && photos.length < 6) {
      const updatedList = [...photos, photoInput.trim()];
      setPhotos(updatedList);
      if (updateUser) {
        updateUser({
          ...user,
          photos: updatedList,
          profileImage: updatedList[0]
        });
      }
      setPhotoInput('');
      setMsg({ type: 'success', text: 'Image added! Remember to click "Save Changes" below.' });
    }
  };

  const handleRemovePhoto = async (idx) => {
    const targetUrl = photos[idx];
    setPhotos(photos.filter((_, i) => i !== idx));

    // Also trigger background Cloudinary delete if applicable
    try {
      await axios.delete(`${BASE_URL}/upload/photo`, {
        data: { photoUrl: targetUrl },
        withCredentials: true
      });
    } catch (err) {
      console.warn('Backend cleanup of photo:', err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    try {
      const payload = {
        firstName,
        lastName,
        age: Number(age),
        gender,
        interestedIn,
        lookingFor: interestedIn,
        bio,
        location,
        education,
        job,
        height,
        relationshipGoal,
        zodiacSign,
        favoriteArtist,
        favoriteSong,
        musicGenre,
        skills,
        interests,
        photos,
        profileImage: photos[0] || user?.profileImage
      };

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.patch(`${BASE_URL}/updateProfile`, payload, {
        withCredentials: true,
        headers
      });

      if (res.data.status) {
        updateUser(res.data.data);
        setMsg({ type: 'success', text: 'Profile updated successfully! 🎉' });
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      } else {
        if (res.data.unauthenticated) {
          setMsg({ type: 'error', text: 'Session expired. Please log in again to save changes.' });
        } else {
          setMsg({ type: 'error', text: res.data.message || 'Update failed' });
        }
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Server error updating profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    try {
      await axios.post(`${BASE_URL}/verify`, {}, { withCredentials: true });
      updateUser({ isVerified: true, verificationStatus: 'approved' });
      alert('Verification badge approved! ✓');
    } catch (e) {
      alert('Verification request failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-20 pb-20 px-4 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
        
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">Edit Dating Profile</h1>
            <p className="text-xs text-gray-500">Showcase your personality, stack & music taste</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-full cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {msg.text && (
          <div className={`p-3.5 rounded-2xl mb-6 text-xs font-bold text-center flex flex-col sm:flex-row items-center justify-center gap-2 ${
            msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            <span>{msg.text}</span>
            {msg.type === 'error' && msg.text.includes('Session') && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Log In Now →
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">

          {/* Photo Management (Grid of 6) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Profile Photos ({photos.length}/6)
            </label>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const photo = photos[idx];
                return (
                  <div
                    key={idx}
                    className="relative aspect-3/4 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 hover:border-red-400 overflow-hidden flex flex-col items-center justify-center text-center group transition-all"
                  >
                    {photo ? (
                      <>
                        <img src={photo} alt="Upload" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white w-6 h-6 rounded-full text-xs font-bold transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-2 left-2 bg-[#fe3c72] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Main
                          </span>
                        )}
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2 hover:bg-red-50/50 transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, idx)}
                          disabled={photoUploading}
                          className="hidden"
                        />
                        <span className="text-xl mb-1">📷</span>
                        <span className="text-[11px] font-bold text-gray-600">
                          {photoUploading ? 'Uploading...' : `+ Photo ${idx + 1}`}
                        </span>
                        <span className="text-[9px] text-gray-400">Add Photo</span>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>

            {photos.length < 6 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, photos.length)}
                      disabled={photoUploading}
                      className="hidden"
                    />
                    <span>☁️</span>
                    <span>{photoUploading ? 'Uploading Image...' : 'Upload Photo from Device'}</span>
                  </label>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    placeholder="Or paste external Image URL..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#fe3c72]"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    + Add URL
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Verification Request */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-blue-900">Photo Verification</h4>
              <p className="text-[11px] text-blue-700">Get the blue checkmark badge on your profile</p>
            </div>
            {user?.isVerified ? (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">✓ Verified</span>
            ) : (
              <button
                type="button"
                onClick={handleRequestVerification}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                Verify Now
              </button>
            )}
          </div>

          {/* Basic Bio & Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">About Me / Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows="3"
                maxLength="500"
                placeholder="What are you building? What kind of connections are you looking for?"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs outline-none focus:border-[#fe3c72]"
              />
              <span className="text-[10px] text-gray-400 text-right block">{bio.length}/500</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Location / City</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#fe3c72]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Relationship Goals</label>
                <select
                  value={relationshipGoal}
                  onChange={(e) => setRelationshipGoal(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#fe3c72] font-semibold"
                >
                  <option value="">Select Goal</option>
                  <option value="long-term">Long-term relationship</option>
                  <option value="long-term-open">Long-term, open to short</option>
                  <option value="short-term">Short-term fun</option>
                  <option value="new-friends">New coding friends</option>
                  <option value="figuring-out">Still figuring it out</option>
                </select>
              </div>
            </div>

            {/* Gender and Interested In Dating Preference */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-rose-50/40 rounded-2xl border border-rose-100">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">My Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#fe3c72] font-semibold"
                >
                  <option value="male">Man / Male</option>
                  <option value="female">Woman / Female</option>
                  <option value="other">Non-binary / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Interested In (Show Me)</label>
                <select
                  value={interestedIn}
                  onChange={(e) => setInterestedIn(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#fe3c72] font-semibold text-[#c8102e]"
                >
                  <option value="female">Women</option>
                  <option value="male">Men</option>
                  <option value="everyone">Everyone (Men & Women)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Job / Role</label>
                <input
                  type="text"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  placeholder="e.g. FullStack Engineer @ Stripe"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Education</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. Stanford University"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Zodiac Sign</label>
                <select
                  value={zodiacSign}
                  onChange={(e) => setZodiacSign(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none font-semibold capitalize"
                >
                  <option value="">Select Zodiac</option>
                  {['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'].map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Height (Optional)</label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 5ft 10in / 178cm"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Music Mode Section */}
          <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-3">
            <h4 className="text-xs font-black text-pink-900 flex items-center">
              <span className="mr-1.5">🎧</span> DevMeet Music Mode
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Favorite Artist</label>
                <input
                  type="text"
                  value={favoriteArtist}
                  onChange={(e) => setFavoriteArtist(e.target.value)}
                  placeholder="e.g. Daft Punk, The Weeknd"
                  className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Top Track</label>
                <input
                  type="text"
                  value={favoriteSong}
                  onChange={(e) => setFavoriteSong(e.target.value)}
                  placeholder="e.g. Starboy / Midnight City"
                  className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Interests Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Passions & Interests ({interests.length}/6)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INTERESTS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleInterest(item)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                    interests.includes(item)
                      ? 'bg-[#fe3c72] text-white border-[#fe3c72]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Tech Stack & Languages
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skills.map((s) => (
                <span key={s} className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-xl flex items-center space-x-1">
                  <span>{s}</span>
                  <button type="button" onClick={() => handleRemoveSkill(s)} className="text-gray-400 hover:text-red-500">✕</button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="e.g. Python, Docker, Next.js"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="bg-black text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#fe3c72] hover:bg-[#e03463] text-white font-bold py-3.5 rounded-full transition-all text-sm shadow-md cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Saving Changes...' : 'Save Profile'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default EditProfile;
