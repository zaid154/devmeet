import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CloseIcon } from './Icons';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    fetchActiveAnnouncements();
  }, []);

  const fetchActiveAnnouncements = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/announcements/active`);
      if (res.data.status && res.data.data) {
        setAnnouncements(res.data.data);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleDismiss = (id) => {
    setDismissed((prev) => [...prev, id]);
  };

  const visibleAnnouncements = announcements.filter(a => !dismissed.includes(a._id));
  if (visibleAnnouncements.length === 0) return null;

  const current = visibleAnnouncements[0];

  const getStyle = (type) => {
    switch (type) {
      case 'danger': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'maintenance': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  // Strip any emoji from title if legacy data had emojis
  const cleanTitle = (current.title || '').replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, '').trim();

  return (
    <div className={`w-full border-b py-2 px-4 text-xs font-medium flex items-center justify-between transition-all ${getStyle(current.type)}`}>
      <div className="flex items-center space-x-2 truncate mx-auto max-w-4xl px-2">
        <span className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-black/10 shadow-2xs">
          {cleanTitle}
        </span>
        <span className="truncate">{current.message}</span>
      </div>

      <button
        onClick={() => handleDismiss(current._id)}
        className="text-slate-400 hover:text-slate-700 p-1 rounded-full text-xs cursor-pointer ml-2"
        title="Dismiss notice"
      >
        <CloseIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
