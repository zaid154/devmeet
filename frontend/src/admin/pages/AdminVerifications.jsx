import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';

const AdminVerifications = () => {
  const [queue, setQueue] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/verifications?filter=${filter}`, { withCredentials: true });
      if (res.data.status) {
        setQueue(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (userId, isVerified) => {
    setActionLoading(userId);
    try {
      const status = isVerified ? 'approved' : 'rejected';
      const res = await axios.patch(
        `${BASE_URL}/admin/users/${userId}/verify`,
        { isVerified, status },
        { withCredentials: true }
      );
      if (res.data.status) {
        fetchQueue();
      }
    } catch (err) {
      alert('Failed to update verification');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Profile Verification Queue
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review submitted identity photos and approve or reject verification applications
            </p>
          </div>

          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto text-xs font-semibold">
            {['pending', 'approved', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3.5 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                  filter === st ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Verifications List */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Loading queue...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-1 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-sm">No {filter} verification requests</h3>
            <p className="text-xs text-slate-400">All submitted applications in this category have been processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {queue.map((u) => (
              <div
                key={u._id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 space-y-4 shadow-2xs transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  
                  {/* User Profile Header */}
                  <div className="flex items-center space-x-3">
                    <img
                      src={u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                      alt={u.firstName}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                        <span>{u.firstName} {u.lastName}</span>
                        {u.isVerified && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] px-1 rounded font-bold">✓</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </div>
                  </div>

                  {/* Submitted Verification Photo */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold uppercase text-slate-400">
                      Submitted Document / Photo
                    </div>
                    <div className="relative h-44 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={u.verificationDocument || u.photos?.[0] || u.profileImage}
                        alt="Verification submission"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    Submitted: {u.verificationSubmittedAt ? new Date(u.verificationSubmittedAt).toLocaleDateString() : 'Recently'}
                  </div>

                </div>

                {/* Decision Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    disabled={actionLoading === u._id}
                    onClick={() => handleDecision(u._id, true)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    disabled={actionLoading === u._id}
                    onClick={() => handleDecision(u._id, false)}
                    className="bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminVerifications;
