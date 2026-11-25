import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { MegaphoneIcon, TrashIcon } from '../components/AdminIcons';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [target, setTarget] = useState('all');
  const [targetLocation, setTargetLocation] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/announcements`, { withCredentials: true });
      if (res.data.status) {
        setAnnouncements(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setSuccess('');
    try {
      const res = await axios.post(
        `${BASE_URL}/admin/announcements`,
        { title, message, type, target, targetLocation, sendNotification },
        { withCredentials: true }
      );
      if (res.data.status) {
        setSuccess('Announcement published successfully.');
        setTitle('');
        setMessage('');
        setTargetLocation('');
        fetchAnnouncements();
      }
    } catch (err) {
      alert('Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await axios.patch(`${BASE_URL}/admin/announcements/${id}/toggle`, {}, { withCredentials: true });
      if (res.data.status) {
        fetchAnnouncements();
      }
    } catch (e) {
      alert('Failed to toggle status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`${BASE_URL}/admin/announcements/${id}`, { withCredentials: true });
      fetchAnnouncements();
    } catch (e) {
      alert('Failed to delete');
    }
  };

  const getTypeBadge = (t) => {
    switch (t) {
      case 'danger': return 'bg-red-50 text-red-700 border-red-200';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'success': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'maintenance': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>System Announcements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create platform-wide notices, maintenance updates, and broadcast alerts
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Create Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">New Announcement</h3>

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3">
                {success}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled Maintenance Notice"
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-xl px-3 py-2 text-slate-900 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  rows="3"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Details for the user notice..."
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-xl p-3 text-slate-900 outline-none transition-colors"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Style</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none capitalize text-xs"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Danger</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Audience</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none capitalize text-xs"
                  >
                    <option value="all">All Users</option>
                    <option value="verified">Verified Only</option>
                    <option value="location">Location Specific</option>
                  </select>
                </div>
              </div>

              {target === 'location' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target City</label>
                  <input
                    type="text"
                    required
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="e.g. San Francisco"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              )}

              <label className="flex items-center space-x-2 pt-1 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="rounded accent-slate-900"
                />
                <span>Also deliver to user notification inboxes</span>
              </label>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                {creating ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </form>
          </div>

          {/* Announcements List */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Current Announcements</h3>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">Loading...</div>
            ) : announcements.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500 shadow-2xs">
                No announcements published.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div
                    key={a._id}
                    className={`bg-white border rounded-2xl p-4 space-y-2.5 shadow-2xs transition-all ${
                      a.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getTypeBadge(a.type)}`}>
                          {a.type}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{a.title}</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleToggleActive(a._id)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md cursor-pointer ${
                            a.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {a.isActive ? 'Active' : 'Paused'}
                        </button>
                        <button
                          onClick={() => handleDelete(a._id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer"
                          title="Delete announcement"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{a.message}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span>Target: {a.target} {a.targetLocation ? `(${a.targetLocation})` : ''}</span>
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminAnnouncements;
