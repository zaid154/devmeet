import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HeartIcon, SearchIcon } from '../components/Icons';
import { BASE_URL } from '../utils/constants';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/searchUsers?query=${encodeURIComponent(searchQuery)}`,
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-36 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Search Developers</h1>
          <p className="text-xs text-slate-500 mt-1">Find developers by name, skills, tech stack, or location</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-2xs border border-slate-200 flex items-center space-x-3">
          <SearchIcon className="w-5 h-5 text-slate-400 pl-1" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keywords (e.g. React, Python, San Francisco, Cloud)..."
            className="flex-1 text-sm font-semibold outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-xs font-semibold text-slate-400 hover:text-slate-700 pr-2">
              Clear
            </button>
          )}
        </div>

        {/* Results Container */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-2xs border border-slate-200">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs font-semibold text-slate-500">Searching developers...</p>
          </div>
        ) : query && results.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-2xs border border-slate-200 space-y-2">
            <h3 className="text-base font-bold text-slate-900">No Developers Found</h3>
            <p className="text-xs text-slate-500">Try searching for other keywords like "TypeScript", "Python", or "Node".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((dev) => {
              const status = sentRequests[dev._id];

              return (
                <div
                  key={dev._id}
                  className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center space-x-3.5">
                    <Link to={`/profile/${dev._id}`}>
                      <img
                        src={dev.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                        alt={dev.firstName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                      />
                    </Link>

                    <div className="min-w-0">
                      <Link to={`/profile/${dev._id}`} className="text-sm font-bold text-slate-900 hover:text-[#fe3c72] truncate block">
                        {dev.firstName} {dev.lastName}
                      </Link>
                      <p className="text-xs text-slate-500 font-medium">{dev.age || 24} y/o &bull; {dev.gender || 'Developer'}</p>
                      {dev.location && <p className="text-[11px] text-slate-400 font-medium truncate">{dev.location}</p>}
                    </div>
                  </div>

                  {dev.bio && (
                    <p className="text-xs text-slate-600 line-clamp-2 font-medium leading-relaxed">
                      {dev.bio}
                    </p>
                  )}

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1">
                    {(dev.skills || ['React', 'Node']).slice(0, 3).map((s, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleSendConnection(dev._id)}
                    disabled={status === 'sent' || status === 'sending'}
                    className={`w-full font-semibold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      status === 'sent'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#fe3c72] hover:bg-[#e03463] text-white shadow-2xs'
                    }`}
                  >
                    {status === 'sending' ? (
                      <span>Sending...</span>
                    ) : status === 'sent' ? (
                      <span>Liked & Requested ✓</span>
                    ) : (
                      <>
                        <HeartIcon className="w-4 h-4 text-white" />
                        <span>Connect & Like</span>
                      </>
                    )}
                  </button>
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
