import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HeartIcon, SearchIcon, ChatIcon } from '../components/Icons';
import { BASE_URL } from '../utils/constants';

const QUICK_TAGS = ['Deepika', 'Alia', 'Anushka', 'Virat', 'React.js', 'Node.js', 'UI/UX', 'Python', 'Delhi', 'Mumbai'];

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Load initial recommended developers
    handleSearch('');
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(query);
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/searchUsers?query=${encodeURIComponent(searchQuery || '')}`,
        { withCredentials: true }
      );
      if (res.data.status) {
        setResults(res.data.data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendConnection = async (targetUserId) => {
    setSentRequests((prev) => ({ ...prev, [targetUserId]: 'sending' }));
    try {
      const res = await axios.post(
        `${BASE_URL}/sendConnection/${targetUserId}/intrested`,
        {},
        { withCredentials: true }
      );
      if (res.data.status) {
        setSentRequests((prev) => ({ ...prev, [targetUserId]: 'sent' }));
      }
    } catch (err) {
      console.error(err);
      setSentRequests((prev) => ({ ...prev, [targetUserId]: 'error' }));
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white pt-5 pb-24 px-4 sm:px-6 lg:px-10 font-sans select-none">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* 1. TOP APP BAR */}
        <header className="flex items-center justify-between pb-3 border-b border-[#1c2230]">
          <button
            onClick={() => navigate('/feed')}
            className="flex items-center space-x-2 text-xs font-bold text-gray-300 hover:text-white transition-all bg-[#121622] hover:bg-[#1c2234] px-4 py-2 rounded-full border border-[#252e42] cursor-pointer shadow-xs"
          >
            <span>←</span>
            <span>Back to Radar</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-lg">🔍</span>
            <span className="text-sm font-black text-white tracking-wider uppercase">
              Dev<span className="text-[#fe3c72]">Meet</span> Search
            </span>
          </div>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center space-x-1.5 text-xs font-bold text-gray-300 hover:text-white bg-[#121622] hover:bg-[#1c2234] px-3.5 py-2 rounded-full border border-[#252e42] transition-colors cursor-pointer"
          >
            <span>💬</span>
            <span className="hidden sm:inline">Messages</span>
          </button>
        </header>

        {/* 2. SEARCH HERO & INPUT */}
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Search by Username & Name
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Instantly find developers, designers & founders by their username, full name, or skills.
            </p>
          </div>

          {/* Search Bar Input */}
          <div className="relative bg-[#121622] p-2 sm:p-2.5 rounded-2xl border-2 border-[#252e42] focus-within:border-[#fe3c72] transition-all flex items-center shadow-lg">
            <div className="pl-3 pr-2 text-gray-400">
              <SearchIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or name (e.g. Deepika, Zaid, Alia, Virat, React)..."
              className="flex-1 text-sm font-semibold outline-none bg-transparent text-white placeholder:text-gray-500 py-1"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-xs font-bold text-gray-400 hover:text-white bg-[#1e2536] px-3 py-1.5 rounded-xl mr-1 cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filter Search Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0">Popular:</span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className={`px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  query.toLowerCase() === tag.toLowerCase()
                    ? 'bg-[#fe3c72] text-white border-[#fe3c72] shadow-sm'
                    : 'bg-[#121622] text-gray-300 border-[#252e42] hover:border-pink-500/50 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 3. RESULTS GRID */}
        {loading ? (
          <div className="bg-[#0e121c] rounded-3xl p-16 text-center border border-[#1e2536] shadow-xl">
            <div className="w-9 h-9 border-3 border-[#fe3c72] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-gray-400">Finding matched developers...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-[#0e121c] rounded-3xl p-16 text-center border border-[#1e2536] space-y-2 shadow-xl">
            <span className="text-3xl block">🔍</span>
            <h3 className="text-base font-black text-white">No Developers Found</h3>
            <p className="text-xs text-gray-400">
              No matching username or name for "{query}". Try searching for "Deepika", "Alia", or "React".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((dev) => {
              const status = sentRequests[dev._id];
              const photos = dev.photos?.length ? dev.photos : [dev.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80'];

              return (
                <div
                  key={dev._id}
                  className="bg-gradient-to-b from-[#141926] to-[#0e121c] rounded-3xl p-5 border border-[#232b3e] flex flex-col justify-between space-y-4 hover:border-pink-500/40 transition-all shadow-xl group"
                >
                  <div>
                    {/* User Header */}
                    <div className="flex items-center space-x-3.5 mb-3">
                      <div className="relative shrink-0">
                        <img
                          src={photos[0]}
                          alt={dev.firstName}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-[#2c3750] group-hover:border-[#fe3c72] transition-colors"
                        />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0e121c] rounded-full" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <h3 className="text-base font-black text-white truncate">
                            {dev.firstName} {dev.lastName}
                          </h3>
                          {dev.isVerified && (
                            <span className="w-4 h-4 rounded-full bg-[#1d9bf0] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-300 font-semibold truncate">
                          {dev.job || 'Software Engineer'} &bull; {dev.age || 24} yrs
                        </p>
                        {dev.location && (
                          <p className="text-[11px] text-gray-400 font-medium truncate flex items-center space-x-1">
                            <span>📍</span>
                            <span>{dev.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    {dev.bio && (
                      <p className="text-xs text-gray-300 line-clamp-2 font-normal leading-relaxed italic mb-3 bg-[#0b0e16]/60 p-2.5 rounded-xl border border-[#1d2332]">
                        "{dev.bio}"
                      </p>
                    )}

                    {/* Skills Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(dev.skills || ['React.js', 'Node.js']).slice(0, 4).map((s, idx) => (
                        <span
                          key={idx}
                          className="bg-[#182030] text-gray-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border border-[#2b374e]"
                        >
                          ⚡ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#1f2637] flex items-center gap-2">
                    <button
                      onClick={() => handleSendConnection(dev._id)}
                      disabled={status === 'sent' || status === 'sending'}
                      className={`flex-1 font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md ${
                        status === 'sent'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-[#fe3c72] to-[#ff655b] hover:opacity-95 text-white'
                      }`}
                    >
                      {status === 'sending' ? (
                        <span>Sending Like...</span>
                      ) : status === 'sent' ? (
                        <span>Liked & Requested ✓</span>
                      ) : (
                        <>
                          <HeartIcon className="w-4 h-4 text-white" />
                          <span>Like / Connect</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => navigate('/chat')}
                      className="bg-[#1c2232] hover:bg-[#252e42] text-gray-300 p-2.5 rounded-xl border border-[#2e3952] transition-colors cursor-pointer"
                      title="Direct Chat"
                    >
                      <ChatIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Search;
