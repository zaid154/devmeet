import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { HeartIcon, ChatIcon, FlameIcon } from '../components/Icons';
import { BASE_URL } from '../utils/constants';

const Connections = () => {
  const { onlineUsers } = useSocket();
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'requests'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchedModalUser, setMatchedModalUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [reqRes, matchRes] = await Promise.all([
        axios.get(`${BASE_URL}/view/all`, { withCredentials: true }),
        axios.get(`${BASE_URL}/view/accepted`, { withCredentials: true }),
      ]);

      if (reqRes.data.status) {
        setRequests(reqRes.data.data || []);
      }
      if (matchRes.data.status) {
        setMatches(matchRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Please log in to view your matches and requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, status, devUser) => {
    try {
      const res = await axios.patch(
        `${BASE_URL}/request/${requestId}/${status}`,
        {},
        { withCredentials: true }
      );

      if (res.data.status) {
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
        if (status === 'accepted') {
          setMatches((prev) => [devUser, ...prev]);
          setMatchedModalUser(devUser);
        }
      }
    } catch (err) {
      console.error('Error handling request:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-36 pb-20 px-4 sm:px-6 lg:px-8 font-sans flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full flex-1">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Connections & Matches</h1>
            <p className="text-xs text-slate-500 mt-1">Manage incoming connection requests and matched developers</p>
          </div>
          
          <Link
            to="/feed"
            className="self-start sm:self-auto bg-[#fe3c72] hover:bg-[#e03463] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xs transition-all flex items-center space-x-1.5"
          >
            <FlameIcon className="w-3.5 h-3.5 text-white" />
            <span>Discover Radar</span>
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-8 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('matches')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center space-x-2 ${
              activeTab === 'matches'
                ? 'border-[#fe3c72] text-[#fe3c72]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Matched Developers</span>
            <span className="bg-red-50 text-[#fe3c72] border border-red-200 text-[10px] px-2 py-0.2 rounded-full font-bold">
              {matches.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center space-x-2 ${
              activeTab === 'requests'
                ? 'border-[#fe3c72] text-[#fe3c72]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Pending Requests</span>
            {requests.length > 0 && (
              <span className="bg-[#fe3c72] text-white text-[10px] px-2 py-0.2 rounded-full font-bold">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-2xs border border-slate-200">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-semibold text-xs text-slate-500">Loading your matches...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xs border border-slate-200">
            <p className="text-xs font-semibold text-red-600 mb-4">{error}</p>
            <Link to="/login" className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-6 py-2.5 rounded-full">
              Sign In
            </Link>
          </div>
        ) : activeTab === 'matches' ? (
          
          /* MATCHED DEVELOPERS TAB */
          matches.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-2xs border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#fe3c72] flex items-center justify-center mx-auto">
                <HeartIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Mutual Matches Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When you like a developer and they like you back, they will appear here.
              </p>
              <Link
                to="/feed"
                className="inline-block bg-[#fe3c72] hover:bg-[#e03463] text-white text-xs font-semibold px-6 py-2.5 rounded-full shadow-xs transition-all mt-2"
              >
                Explore Discover Feed
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {matches.map((dev) => {
                const isOnline = onlineUsers.has(dev._id);
                return (
                  <div
                    key={dev._id}
                    className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-center space-x-3.5">
                      <Link to={`/profile/${dev._id}`} className="relative shrink-0">
                        <img
                          src={dev.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                          alt={dev.firstName}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                        />
                        {isOnline && (
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                        )}
                      </Link>

                      <div className="min-w-0">
                        <Link to={`/profile/${dev._id}`} className="text-sm font-bold text-slate-900 hover:text-[#fe3c72] transition-colors truncate block">
                          {dev.firstName} {dev.lastName}
                        </Link>
                        <p className="text-xs text-slate-500 font-medium">{dev.age || 24} y/o &bull; {dev.gender || 'Developer'}</p>
                        {dev.location && <p className="text-[11px] text-slate-400 font-medium truncate">{dev.location}</p>}
                      </div>
                    </div>

                    {/* Tech Stack Chips */}
                    <div className="flex flex-wrap gap-1">
                      {(dev.skills || ['React', 'Node']).slice(0, 3).map((s, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Chat Action */}
                    <button
                      onClick={() => navigate('/chat', { state: { targetUser: dev } })}
                      className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-2.5 rounded-xl text-xs shadow-2xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ChatIcon className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )

        ) : (

          /* PENDING REQUESTS TAB */
          requests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-2xs border border-slate-200 space-y-2">
              <h3 className="text-sm font-bold text-slate-900">No Pending Requests</h3>
              <p className="text-xs text-slate-500">You're all caught up. Keep exploring developer profiles.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const dev = req.fromUserId || {};
                const isSuperLike = req.status === 'super-like';

                return (
                  <div
                    key={req._id}
                    className={`bg-white rounded-2xl p-5 shadow-2xs border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSuperLike ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <Link to={`/profile/${dev._id}`}>
                        <img
                          src={dev.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                          alt={dev.firstName}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                        />
                      </Link>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Link to={`/profile/${dev._id}`} className="text-sm font-bold text-slate-900 hover:text-[#fe3c72]">
                            {dev.firstName} {dev.lastName}
                          </Link>
                          {isSuperLike && (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.2 rounded">
                              Super Like
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{dev.bio || 'Wants to connect and collaborate with you'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAction(req._id, 'rejected', dev)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Decline
                      </button>

                      <button
                        onClick={() => handleAction(req._id, 'accepted', dev)}
                        className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

      </div>

      {/* Match Celebration Modal */}
      {matchedModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-2xs p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-sm w-full text-center space-y-5 border border-slate-200 shadow-xl">
            <h2 className="text-2xl font-black text-slate-900">
              It's a Match!
            </h2>
            <p className="text-xs text-slate-600">
              You and <strong className="text-slate-900">{matchedModalUser.firstName}</strong> have connected with each other.
            </p>

            <img
              src={matchedModalUser.profileImage}
              alt="Match"
              className="w-20 h-20 rounded-full border-2 border-slate-300 object-cover mx-auto shadow-md"
            />

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  const target = matchedModalUser;
                  setMatchedModalUser(null);
                  navigate('/chat', { state: { targetUser: target } });
                }}
                className="w-full bg-[#fe3c72] hover:bg-[#e03463] text-white font-semibold py-3 rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Send Message
              </button>

              <button
                onClick={() => setMatchedModalUser(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Connections;
