import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { BellIcon, HeartIcon, ChatIcon } from '../components/Icons';
import { BASE_URL } from '../utils/constants';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { setUnreadNotifications } = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/notifications`, { withCredentials: true });
      if (res.data.status) {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(`${BASE_URL}/notifications/${id}/read`, {}, { withCredentials: true });
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.patch(`${BASE_URL}/notifications/read-all`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifications(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-36 pb-20 px-4 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
            <p className="text-xs text-slate-500 mt-1">Updates on matches, messages, and platform activity</p>
          </div>
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-[#fe3c72] hover:underline cursor-pointer bg-red-50 hover:bg-red-100 px-3.5 py-1.5 rounded-full transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-2xs border border-slate-200">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-semibold text-xs text-slate-500">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xs border border-slate-200">
            <p className="text-xs font-semibold text-red-600 mb-4">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-2xs border border-slate-200 space-y-2">
            <h3 className="text-base font-bold text-slate-900">No Notifications</h3>
            <p className="text-xs text-slate-500">You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const fromUser = n.fromUserId || {};
              return (
                <div
                  key={n._id}
                  onClick={() => !n.read && markAsRead(n._id)}
                  className={`p-4 rounded-2xl border transition-all flex items-start space-x-3.5 cursor-pointer shadow-2xs ${
                    n.read
                      ? 'bg-white border-slate-200 text-slate-700'
                      : 'bg-white border-[#fe3c72]/30 ring-1 ring-[#fe3c72]/10 text-slate-900'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                    {n.type === 'match' || n.type === 'like' ? (
                      <HeartIcon className="w-4 h-4 text-[#fe3c72]" />
                    ) : n.type === 'message' ? (
                      <ChatIcon className="w-4 h-4 text-blue-600" />
                    ) : (
                      <BellIcon className="w-4 h-4 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>

                    {fromUser._id && (
                      <div className="mt-2 flex items-center space-x-2">
                        <Link
                          to={`/profile/${fromUser._id}`}
                          className="text-[11px] font-semibold text-[#fe3c72] hover:underline flex items-center space-x-1.5"
                        >
                          <img
                            src={fromUser.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover border border-slate-200"
                          />
                          <span>View {fromUser.firstName}'s Profile</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-[#fe3c72] shrink-0 self-center"></span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
