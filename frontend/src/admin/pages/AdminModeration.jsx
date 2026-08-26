import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { RefreshIcon, TrashIcon } from '../components/AdminIcons';

const AdminModeration = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Bio reset state
  const [bioUserId, setBioUserId] = useState('');
  const [bioResetReason, setBioResetReason] = useState('');
  const [bioLoading, setBioLoading] = useState(false);
  const [bioSuccess, setBioSuccess] = useState('');

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/moderation/photos`, { withCredentials: true });
      if (res.data.status) {
        setPhotos(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async (userId, photoUrl) => {
    if (!window.confirm('Are you sure you want to remove this photo for violating content guidelines?')) return;
    setActionLoading(photoUrl);
    try {
      const res = await axios.delete(`${BASE_URL}/admin/moderation/photo`, {
        data: { userId, photoUrl },
        withCredentials: true
      });
      if (res.data.status) {
        setPhotos(prev => prev.filter(p => p.photoUrl !== photoUrl));
      }
    } catch (err) {
      alert('Failed to remove photo');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetBio = async (e) => {
    e.preventDefault();
    if (!bioUserId) return;
    setBioLoading(true);
    setBioSuccess('');
    try {
      const res = await axios.patch(
        `${BASE_URL}/admin/moderation/bio`,
        { userId: bioUserId, reason: bioResetReason },
        { withCredentials: true }
      );
      if (res.data.status) {
        setBioSuccess('Bio successfully reset and logged.');
        setBioUserId('');
        setBioResetReason('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset bio');
    } finally {
      setBioLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Content & Media Moderation
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review user-uploaded gallery photos and reset inappropriate bio descriptions
            </p>
          </div>
          <button
            onClick={fetchPhotos}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
          >
            <RefreshIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh Media</span>
          </button>
        </div>

        {/* Photo Gallery Wall */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Uploaded Media ({photos.length})
            </h2>
            <span className="text-xs text-slate-500">Recent photo submissions</span>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs">Loading media gallery...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500 shadow-2xs">
              No photos found in queue.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {photos.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    <img
                      src={item.photoUrl}
                      alt={item.userName}
                      className="w-full h-full object-cover"
                    />
                    {item.isMain && (
                      <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Primary Avatar
                      </span>
                    )}
                  </div>

                  <div className="p-3 space-y-2">
                    <div>
                      <div className="font-semibold text-xs text-slate-900 truncate">{item.userName}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{item.userEmail}</div>
                    </div>

                    <button
                      disabled={actionLoading === item.photoUrl}
                      onClick={() => handleRemovePhoto(item.userId, item.photoUrl)}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold py-1.5 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === item.photoUrl ? 'Removing...' : 'Remove Photo'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bio Reset Utility */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 max-w-xl shadow-2xs">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Reset User Bio</h3>
            <p className="text-xs text-slate-500 mt-0.5">Clear inappropriate or policy-violating text from a user profile</p>
          </div>

          {bioSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3">
              {bioSuccess}
            </div>
          )}

          <form onSubmit={handleResetBio} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">User ID</label>
              <input
                type="text"
                required
                value={bioUserId}
                onChange={(e) => setBioUserId(e.target.value)}
                placeholder="24-character MongoDB User ID"
                className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Audit Reason</label>
              <input
                type="text"
                value={bioResetReason}
                onChange={(e) => setBioResetReason(e.target.value)}
                placeholder="e.g. Inappropriate language or spam in description"
                className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl px-3 py-2 text-slate-900 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={bioLoading}
              className="bg-slate-900 hover:bg-black text-white font-semibold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {bioLoading ? 'Resetting...' : 'Clear Bio'}
            </button>
          </form>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminModeration;
