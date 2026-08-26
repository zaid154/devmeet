import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BASE_URL } from '../utils/constants';

const Settings = ({ isModal = false, onClose, onSaved }) => {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('preferences');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Preferences
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(45);
  const [gender, setGender] = useState('everyone');
  const [location, setLocation] = useState('');

  // Privacy
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [showProfile, setShowProfile] = useState(true);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchBlocked();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/settings`, { withCredentials: true });
      if (res.data.status && res.data.data) {
        const { preferences, privacy } = res.data.data;
        if (preferences) {
          setAgeMin(preferences.ageMin || 18);
          setAgeMax(preferences.ageMax || 45);
          setGender(preferences.gender || 'everyone');
          setLocation(preferences.location || '');
        }
        if (privacy) {
          setShowOnlineStatus(privacy.showOnlineStatus ?? true);
          setShowLastSeen(privacy.showLastSeen ?? true);
          setShowProfile(privacy.showProfile ?? true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBlocked = async () => {
    setLoadingBlocked(true);
    try {
      const res = await axios.get(`${BASE_URL}/blocked-users`, { withCredentials: true });
      if (res.data.status) {
        setBlockedUsers(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await axios.patch(`${BASE_URL}/settings`, {
        preferences: { ageMin, ageMax, gender, location },
        privacy: { showOnlineStatus, showLastSeen, showProfile }
      }, { withCredentials: true });

      if (res.data.status) {
        if (res.data.data) {
          updateUser(res.data.data);
        }
        setMsg({ type: 'success', text: 'Dating preferences updated successfully! 🎉' });
        if (onSaved) onSaved();
        if (isModal && onClose) {
          setTimeout(() => onClose(), 900);
        }
      } else {
        setMsg({ type: 'error', text: 'Failed to update settings' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Server error updating settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await axios.delete(`${BASE_URL}/block/${userId}`, { withCredentials: true });
      setBlockedUsers(prev => prev.filter(b => b.blockedId?._id !== userId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you ABSOLUTELY sure? This will delete your entire account, matches, messages, and photos permanently.')) {
      try {
        await axios.delete(`${BASE_URL}/account`, { withCredentials: true });
        logout();
      } catch (err) {
        alert('Failed to delete account');
      }
    }
  };

  const content = (
    <div className={`${isModal ? 'p-6 sm:p-8 max-h-[85vh] overflow-y-auto' : 'max-w-3xl mx-auto'}`}>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">App Settings</h1>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-xs sm:text-sm text-gray-500 mb-6">Manage discovery preferences, privacy, and account security</p>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-3 sm:gap-6 text-xs sm:text-sm font-bold overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-2.5 sm:pb-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'preferences' ? 'border-[#fe3c72] text-[#fe3c72]' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Dating Preferences
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 sm:pb-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'privacy' ? 'border-[#fe3c72] text-[#fe3c72]' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Privacy
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`pb-2.5 sm:pb-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'blocked' ? 'border-[#fe3c72] text-[#fe3c72]' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Blocked ({blockedUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`pb-2.5 sm:pb-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'account' ? 'border-[#fe3c72] text-[#fe3c72]' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Account
          </button>
        </div>

        {msg.text && (
          <div className={`p-4 rounded-2xl mb-6 text-xs font-bold text-center ${
            msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {msg.text}
          </div>
        )}

        {/* Dating Preferences Tab */}
        {activeTab === 'preferences' && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Looking For
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['female', 'male', 'everyone'].map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGender(g)}
                    className={`py-3 rounded-2xl text-xs font-bold capitalize transition-all border ${
                      gender === g ? 'bg-[#fe3c72] text-white border-[#fe3c72]' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {g === 'everyone' ? '✨ Everyone' : g === 'female' ? '👩 Women' : '👨 Men'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Age Range
                </label>
                <span className="text-xs font-bold text-[#fe3c72]">{ageMin} - {ageMax} years old</span>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="18"
                  max="60"
                  value={ageMin}
                  onChange={(e) => setAgeMin(Math.min(Number(e.target.value), ageMax - 1))}
                  className="w-full accent-[#fe3c72]"
                />
                <input
                  type="range"
                  min="18"
                  max="60"
                  value={ageMax}
                  onChange={(e) => setAgeMax(Math.max(Number(e.target.value), ageMin + 1))}
                  className="w-full accent-[#fe3c72]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Passport / Location Mode (Discover by City)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or London, UK"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#fe3c72]"
              />
              <p className="text-[11px] text-gray-400 mt-1">Leave blank to discover people in all locations</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#fe3c72] hover:bg-[#e03463] text-white font-bold py-3.5 rounded-full transition-all text-sm shadow-md cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        )}

        {/* Privacy & Appearance Tab */}
        {activeTab === 'privacy' && (
          <form onSubmit={handleSaveSettings} className="rounded-3xl p-6 sm:p-8 border space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            
            {/* Theme / Appearance Toggle (Light vs Dark) */}
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h4 className="text-sm font-bold flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
                  <span>{isDark ? '🌙' : '☀️'}</span>
                  <span>Theme & Appearance</span>
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Currently in <strong style={{ color: 'var(--accent)' }}>{isDark ? 'Dark Mode (OLED Black)' : 'Light Mode (Clean White)'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs border"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                <span>{isDark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Show Online Status</h4>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Allow matches to see when you're active</p>
              </div>
              <input
                type="checkbox"
                checked={showOnlineStatus}
                onChange={(e) => setShowOnlineStatus(e.target.checked)}
                className="w-5 h-5 accent-[#fe3c72] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Show Last Seen</h4>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Display your recent activity timestamp</p>
              </div>
              <input
                type="checkbox"
                checked={showLastSeen}
                onChange={(e) => setShowLastSeen(e.target.checked)}
                className="w-5 h-5 accent-[#fe3c72] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Profile Visibility</h4>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Show profile in the Discover card stack</p>
              </div>
              <input
                type="checkbox"
                checked={showProfile}
                onChange={(e) => setShowProfile(e.target.checked)}
                className="w-5 h-5 accent-[#fe3c72] cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#fe3c72] hover:bg-[#e03463] text-white font-bold py-3.5 rounded-full transition-all text-sm shadow-md cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        )}

        {/* Blocked Users Tab */}
        {activeTab === 'blocked' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
            {loadingBlocked ? (
              <p className="text-center text-xs font-bold text-gray-400 py-6">Loading blocked list...</p>
            ) : blockedUsers.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl">🛡️</span>
                <p className="text-sm font-bold mt-2">No Blocked Users</p>
                <p className="text-xs text-gray-400 mt-1">You haven't blocked anyone yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedUsers.map((b) => (
                  <div key={b._id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <img
                        src={b.blockedId?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                        alt="Blocked user"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{b.blockedId?.firstName} {b.blockedId?.lastName}</h4>
                        <p className="text-[10px] text-gray-400">Blocked user</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblock(b.blockedId?._id)}
                      className="bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold px-4 py-1.5 rounded-full border border-gray-200 cursor-pointer transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-6">
            <div>
              <h4 className="text-sm font-bold mb-1">Account Email</h4>
              <p className="text-xs text-gray-500 font-mono bg-gray-50 p-3 rounded-xl border border-gray-100">{user?.email}</p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">Log out</h4>
                <p className="text-xs text-gray-500">Sign out on this device</p>
              </div>
              <button
                onClick={logout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-6 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>

            <div className="pt-6 border-t border-red-100 space-y-2">
              <h4 className="text-sm font-bold text-red-600">Danger Zone</h4>
              <p className="text-xs text-gray-500">
                Permanently delete your profile, pictures, chats, match history, and account data. This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-6 py-3 rounded-full border border-red-200 transition-colors cursor-pointer mt-2"
              >
                Delete My Account
              </button>
            </div>
          </div>
        )}
      </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in select-none">
        <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-20 pb-16 px-4 font-sans select-none">
      {content}
    </div>
  );
};

export default Settings;
