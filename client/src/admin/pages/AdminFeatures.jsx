import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';

const AdminFeatures = () => {
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const FEATURE_METADATA = [
    { key: 'dating', label: 'Discover & Swiping', desc: 'Core matching discovery radar stack and swipe actions' },
    { key: 'superLike', label: 'Super Like', desc: 'Priority star matching and instant notification alerts' },
    { key: 'doubleDate', label: 'Double Date Mode', desc: 'Friend pair matchmaking and collaborative dating' },
    { key: 'musicMode', label: 'Music Mode Vibes', desc: 'Spotify favorites, artist badges, and music compatibility' },
    { key: 'astrology', label: 'Astrology Compatibility', desc: 'Zodiac signs and astrological harmony indicators' },
    { key: 'passport', label: 'Passport Global Discovery', desc: 'Virtual location selection across global tech hubs' },
    { key: 'voiceCall', label: 'WebRTC Voice Calls', desc: 'Peer-to-peer real-time audio phone calling between matches' },
    { key: 'videoCall', label: 'WebRTC Video Calls', desc: 'Real-time high definition video calling between matches' },
    { key: 'gif', label: 'GIF Reactions in Chat', desc: 'Integrated GIF keyboard and animated sticker search' },
    { key: 'voiceNotes', label: 'Audio Voice Notes', desc: 'Microphone voice clip recording and in-chat audio player' },
    { key: 'verification', label: 'ID & Profile Verification', desc: 'Official blue badge identity validation submissions' },
  ];

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/features`, { withCredentials: true });
      if (res.data.status) {
        setFeatures(res.data.data || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await axios.patch(
        `${BASE_URL}/admin/features`,
        { features },
        { withCredentials: true }
      );
      if (res.data.status) {
        setMessage('Feature configuration saved.');
        setFeatures(res.data.data);
      }
    } catch (err) {
      alert('Failed to save feature flags');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Feature Flags & System Toggles
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enable or disable platform capabilities dynamically without code deployment
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3 flex items-center justify-between">
            <span>{message}</span>
            <span className="text-[11px] text-emerald-600 font-mono">Live on Client</span>
          </div>
        )}

        {/* Feature Switches Grid */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Loading configuration...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURE_METADATA.map((feat) => {
              const isEnabled = features[feat.key] !== false;
              return (
                <div
                  key={feat.key}
                  className={`bg-white border rounded-2xl p-5 transition-all shadow-2xs flex flex-col justify-between space-y-4 ${
                    isEnabled ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-900">{feat.label}</div>
                      
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => handleToggle(feat.key)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                      </label>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">flag: {feat.key}</span>
                    <span className={isEnabled ? 'text-emerald-700 font-semibold' : 'text-slate-400 font-semibold'}>
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminFeatures;
