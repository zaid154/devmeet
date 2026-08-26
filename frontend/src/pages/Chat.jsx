import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { BASE_URL } from '../utils/constants';
import CallOverlay from '../components/CallOverlay';

// Curated GIFs
const POPULAR_GIFS = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3Q4eGg2Y3h2N2FkNjR3OXJvZ3J2bDJ1dG96MDFob2ZlZTNubHZwZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKSjRrfIPjeiVyM/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHR1NnFsd3F3dTZ4NGZidG10NnJybWltM2hpeGZ0NXg0NXA5ZDNvOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0MYt5jPR6QX5pnqM/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3N2bzdrNHlhZmpzdnVibHR2dnlqd2g2MWU2OHBqdW9hMXc4cXRxeSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ICOgUNjpvO0PC/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpqd2ZlOG41cWVmd2hjcWZlZXk2NGcydnVsc214b2dqaHR0MmgxaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ASd0Ukj0y3qMM/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnV1cmg1anpsdDZlMnptdHpqNmtveXJ6MnBwNmtob3M1bWFpdDdtYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l3q2K5jinAlChoCLS/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGJ0cm9tdmYyZWh5MW1mMWl4anRqczIydzdrOW9ocG5xZHA1MnN2YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oz8xAFtqoOUUrsh7W/giphy.gif'
];

const ICEBREAKERS = [
  "Tabs or Spaces?",
  "What is your dream tech stack?",
  "Coffee ☕ or Energy Drink ⚡ during late night deploys?",
  "What project are you most proud of?",
  "Dark theme or Light theme?"
];

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=fe3c72&color=fff&bold=true&size=128&name=';

const Avatar = ({ src, name, size = 'w-11 h-11', className = '', online }) => {
  const fallback = `${DEFAULT_AVATAR}${encodeURIComponent(name || 'U')}`;
  return (
    <div className={`relative shrink-0 ${size} ${className}`}>
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border border-black/10 shadow-2xs">
        <img
          src={src || fallback}
          alt={name || 'User'}
          className="w-full h-full object-cover object-center aspect-square"
          onError={(e) => { e.target.src = fallback; }}
        />
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 rounded-full z-10" style={{ borderColor: 'var(--bg-card)' }} />
      )}
    </div>
  );
};

const Chat = () => {
  const { user } = useAuth();
  const { socket, onlineUsers, sendMessage: sendSocketMessage, emitTyping } = useSocket();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(location.state?.targetUser || null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Media pickers
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);

  // Typing state
  const [isTargetTyping, setIsTargetTyping] = useState(false);

  // Safety menu
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);

  // Call state
  const [callState, setCallState] = useState({
    status: 'idle',
    targetUser: null,
    callType: 'audio'
  });

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const safetyMenuRef = useRef(null);

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    if (activeUser?._id) fetchMessages(activeUser._id);
  }, [activeUser]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (
        (msg.senderId?._id || msg.senderId) === activeUser?._id ||
        (msg.receiverId?._id || msg.receiverId) === activeUser?._id
      ) {
        setMessages((prev) => [...prev, msg]);
      }
      fetchConversations();
    };

    const handleUserTyping = ({ senderId, isTyping }) => {
      if (senderId === activeUser?._id) setIsTargetTyping(isTyping);
    };

    const handleIncomingCall = ({ callerInfo, callType }) => {
      setCallState({ status: 'incoming', targetUser: callerInfo, callType: callType || 'audio' });
    };
    const handleCallAnswered = () => setCallState((prev) => ({ ...prev, status: 'connected' }));
    const handleCallRejected = () => { setCallState({ status: 'idle', targetUser: null, callType: 'audio' }); };
    const handleCallEnded = () => { setCallState({ status: 'idle', targetUser: null, callType: 'audio' }); };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-answered', handleCallAnswered);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-answered', handleCallAnswered);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
    };
  }, [socket, activeUser]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Close safety menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (safetyMenuRef.current && !safetyMenuRef.current.contains(e.target)) {
        setShowSafetyMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/conversations`, { withCredentials: true });
      if (res.data.status) {
        setConversations(res.data.data || []);
        if (!activeUser && res.data.data?.length > 0) {
          setActiveUser(res.data.data[0].user);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (targetId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/messages/${targetId}`, { withCredentials: true });
      if (res.data.status) setMessages(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (payloadOverride) => {
    if (!activeUser?._id) return;
    const payload = payloadOverride || { text: inputMessage.trim(), type: 'text' };
    if (!payload.text && !payload.mediaUrl && payload.type === 'text') return;

    if (!payloadOverride) setInputMessage('');
    setShowEmoji(false);
    setShowGifPicker(false);
    emitTyping(activeUser._id, false);

    try {
      const res = await axios.post(`${BASE_URL}/messages/${activeUser._id}`, payload, { withCredentials: true });
      if (res.data.status) {
        const savedMsg = res.data.data;
        setMessages((prev) => [...prev, savedMsg]);
        sendSocketMessage(activeUser._id, savedMsg);
        fetchConversations();
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (activeUser?._id) emitTyping(activeUser._id, e.target.value.length > 0);
  };

  const onEmojiClick = (emojiData) => setInputMessage((prev) => prev + emojiData.emoji);

  const handleSendGif = (gifUrl) => {
    handleSendMessage({ type: 'gif', mediaUrl: gifUrl, text: 'GIF' });
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${BASE_URL}/upload`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status && res.data.url) {
        handleSendMessage({ type: 'image', mediaUrl: res.data.url, text: '📷 Photo' });
      }
    } catch (err) {
      alert('Failed to upload image');
    }
  };

  // Voice recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioFile);
        try {
          const res = await axios.post(`${BASE_URL}/upload`, formData, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (res.data.status && res.data.url) {
            handleSendMessage({ type: 'voice_note', mediaUrl: res.data.url, duration: voiceDuration, text: '🎤 Voice Note' });
          }
        } catch (e) { console.error(e); }
      };
      mediaRecorderRef.current.start();
      setIsRecordingVoice(true);
      setVoiceDuration(0);
      recordingTimerRef.current = setInterval(() => setVoiceDuration((prev) => prev + 1), 1000);
    } catch (err) {
      alert('Microphone permission required for voice notes');
    }
  };

  const stopVoiceRecording = (cancel = false) => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingVoice(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (cancel) { mediaRecorderRef.current.stop(); audioChunksRef.current = []; }
      else { mediaRecorderRef.current.stop(); }
    }
  };

  // Calls
  const startCall = (callType) => {
    if (!activeUser?._id) return;
    setCallState({ status: 'calling', targetUser: activeUser, callType });
    if (socket) socket.emit('call-offer', { targetUserId: activeUser._id, callerInfo: user, callType });
  };
  const handleEndCall = () => {
    if (socket && callState.targetUser?._id) socket.emit('call-end', { targetUserId: callState.targetUser._id });
    setCallState({ status: 'idle', targetUser: null, callType: 'audio' });
  };
  const handleAcceptCall = () => {
    setCallState((prev) => ({ ...prev, status: 'connected' }));
    if (socket && callState.targetUser?._id) socket.emit('call-answer', { targetUserId: callState.targetUser._id });
  };
  const handleDeclineCall = () => {
    if (socket && callState.targetUser?._id) socket.emit('call-reject', { targetUserId: callState.targetUser._id });
    setCallState({ status: 'idle', targetUser: null, callType: 'audio' });
  };

  // Safety
  const handleUnmatch = async () => {
    if (window.confirm(`Are you sure you want to unmatch with ${activeUser.firstName}?`)) {
      try {
        await axios.post(`${BASE_URL}/unmatch/${activeUser._id}`, {}, { withCredentials: true });
        setActiveUser(null);
        fetchConversations();
      } catch (e) { alert('Failed to unmatch'); }
    }
    setShowSafetyMenu(false);
  };
  const handleBlock = async () => {
    if (window.confirm(`Block ${activeUser.firstName}? They won't be able to message or see your profile.`)) {
      try {
        await axios.post(`${BASE_URL}/block/${activeUser._id}`, {}, { withCredentials: true });
        setActiveUser(null);
        fetchConversations();
      } catch (e) { alert('Failed to block user'); }
    }
    setShowSafetyMenu(false);
  };

  const filteredConversations = conversations.filter(c =>
    `${c.user?.firstName} ${c.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isOnline = activeUser ? onlineUsers.has(activeUser._id) : false;

  const formatMessageTime = (date) => {
    return new Date(date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /* ============================================================ */
  /* RENDER                                                       */
  /* ============================================================ */
  return (
    <div className="h-screen w-full flex font-sans overflow-hidden select-none relative pb-14 md:pb-0" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ========== SIDEBAR ========== */}
      <div className={`${activeUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col h-full shrink-0 border-r`} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>

        {/* Sidebar Header */}
        <div className="p-4 space-y-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Messages</h2>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-light)' }}>
              {conversations.length} {conversations.length === 1 ? 'Match' : 'Matches'}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium outline-none transition-colors border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Safety Banner */}
        <div className="px-4 py-3 flex items-center space-x-2.5 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <span className="text-base">🛡️</span>
          <p className="text-[11px] font-semibold leading-snug" style={{ color: 'var(--text-muted)' }}>
            Stay safe! Never share personal info or send money to someone you haven't met.
          </p>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <span className="text-4xl block">💬</span>
              <h4 className="text-sm font-black" style={{ color: 'var(--text-secondary)' }}>No conversations yet</h4>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Match with developers to start chatting!
              </p>
              <button onClick={() => navigate('/feed')} className="text-xs font-bold px-4 py-2 rounded-full transition-colors cursor-pointer" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                Find Matches
              </button>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const u = c.user || {};
              const isSelected = activeUser?._id === u._id;
              const userOnline = onlineUsers.has(u._id);

              return (
                <div
                  key={c.connectionId || u._id}
                  onClick={() => setActiveUser(u)}
                  className="px-4 py-3 flex items-center space-x-3 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Avatar src={u.profileImage} name={u.firstName} size="w-12 h-12" online={userOnline} />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {u.firstName} {u.lastName}
                      </h4>
                      {c.lastMessage && (
                        <span className="text-[10px] font-medium shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                          {formatMessageTime(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate mt-0.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {c.lastMessage?.text || 'Started a conversation'}
                    </p>
                  </div>

                  {c.unreadCount > 0 && (
                    <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========== MAIN CHAT AREA ========== */}
      {activeUser ? (
        <div className="flex-1 flex flex-col h-full relative w-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>

          {/* Chat Header */}
          <div className="px-3 sm:px-5 py-3 flex items-center justify-between z-10 border-b shrink-0" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">

              {/* Mobile Back Button */}
              <button
                onClick={() => setActiveUser(null)}
                className="md:hidden p-1.5 -ml-1 rounded-full cursor-pointer transition-colors flex items-center justify-center"
                style={{ color: 'var(--text-secondary)' }}
                title="Back to messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>

              <Link to={`/profile/${activeUser._id}`} className="shrink-0">
                <Avatar src={activeUser.profileImage} name={activeUser.firstName} size="w-10 h-10" online={isOnline} />
              </Link>

              <div className="min-w-0">
                <Link to={`/profile/${activeUser._id}`} className="text-sm font-black flex items-center space-x-1.5 hover:opacity-80 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                  <span className="truncate">{activeUser.firstName} {activeUser.lastName}</span>
                  {activeUser.isVerified && <span className="text-blue-500 text-[10px]">✓</span>}
                </Link>
                <p className="text-[11px] font-semibold flex items-center">
                  {isTargetTyping ? (
                    <span className="font-bold animate-pulse" style={{ color: 'var(--accent)' }}>Typing...</span>
                  ) : isOnline ? (
                    <span className="text-emerald-500 font-bold">Online</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Offline</span>
                  )}
                </p>
              </div>
            </div>

            {/* Header Actions: Call + Safety */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <button
                onClick={() => startCall('audio')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                title="Voice Call"
              >📞</button>
              <button
                onClick={() => startCall('video')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                title="Video Call"
              >📹</button>

              {/* Safety Menu */}
              <div className="relative" ref={safetyMenuRef}>
                <button
                  onClick={() => setShowSafetyMenu(!showSafetyMenu)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                >•••</button>
                {showSafetyMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl p-2 text-xs font-bold z-30 border shadow-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <Link to={`/profile/${activeUser._id}`} className="w-full text-left p-2.5 rounded-xl cursor-pointer flex items-center space-x-2 transition-colors block" style={{ color: 'var(--text-primary)' }}>
                      <span>👤</span><span>View Profile</span>
                    </Link>
                    <button onClick={handleUnmatch} className="w-full text-left p-2.5 rounded-xl cursor-pointer flex items-center space-x-2 transition-colors text-amber-500 hover:bg-amber-500/10">
                      <span>💔</span><span>Unmatch</span>
                    </button>
                    <button onClick={handleBlock} className="w-full text-left p-2.5 rounded-xl cursor-pointer flex items-center space-x-2 transition-colors text-red-500 hover:bg-red-500/10">
                      <span>🚫</span><span>Block & Report</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">

            {/* Loading State */}
            {loading && messages.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              </div>
            )}

            {/* Empty State — Icebreakers */}
            {!loading && messages.length === 0 && (
              <div className="max-w-sm mx-auto my-8 rounded-3xl p-6 text-center space-y-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl" style={{ backgroundColor: 'var(--accent-light)' }}>
                  💬
                </div>
                <div>
                  <h4 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Say Hello to {activeUser.firstName}!</h4>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pick an icebreaker to get the conversation rolling:</p>
                </div>
                <div className="flex flex-col space-y-2 pt-1">
                  {ICEBREAKERS.map((ice, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage({ text: ice, type: 'text' })}
                      className="text-xs font-bold py-2.5 px-4 rounded-full transition-colors text-left cursor-pointer border"
                      style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--border-color)' }}
                    >
                      💡 {ice}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Bubbles */}
            {messages.map((m, idx) => {
              const isMine = (m.senderId?._id || m.senderId) === user?._id;
              const showAvatar = !isMine && (idx === 0 || (messages[idx - 1]?.senderId?._id || messages[idx - 1]?.senderId) !== (m.senderId?._id || m.senderId));

              return (
                <div key={m._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end space-x-2`}>

                  {/* Receiver Avatar */}
                  {!isMine && (
                    <div className="w-7 h-7 shrink-0 mb-1">
                      {showAvatar ? (
                        <Avatar src={activeUser.profileImage} name={activeUser.firstName} size="w-7 h-7" />
                      ) : (
                        <div className="w-7 h-7" />
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-3.5 py-2.5 space-y-1 ${
                      isMine ? 'rounded-br-sm' : 'rounded-bl-sm'
                    }`}
                    style={{
                      backgroundColor: isMine ? 'var(--bubble-sent-bg)' : 'var(--bubble-received-bg)',
                      color: isMine ? 'var(--bubble-sent-text)' : 'var(--bubble-received-text)',
                      border: isMine ? 'none' : '1px solid var(--bubble-received-border)',
                    }}
                  >
                    {/* Image */}
                    {m.type === 'image' && m.mediaUrl && (
                      <img src={m.mediaUrl} alt="Shared" className="rounded-xl max-h-60 w-full object-cover cursor-pointer mb-1" onError={(e) => { e.target.style.display = 'none'; }} />
                    )}

                    {/* GIF */}
                    {m.type === 'gif' && m.mediaUrl && (
                      <img src={m.mediaUrl} alt="GIF" className="rounded-xl max-h-52 w-full object-cover mb-1" />
                    )}

                    {/* Voice Note */}
                    {m.type === 'voice_note' && m.mediaUrl && (
                      <div className="flex items-center space-x-2 py-1">
                        <span className="text-base">🎤</span>
                        <audio src={m.mediaUrl} controls className="h-8 max-w-[200px]" style={{ filter: isMine ? 'invert(1) brightness(2)' : isDark ? 'invert(1) brightness(1.5)' : 'none' }} />
                      </div>
                    )}

                    {/* Text */}
                    {m.text && m.type !== 'gif' && <p className="text-[13px] font-medium leading-relaxed break-words">{m.text}</p>}

                    {/* Timestamp + Read */}
                    <div className={`flex items-center space-x-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] font-medium opacity-70">{formatMessageTime(m.createdAt)}</span>
                      {isMine && <span className="text-[9px] opacity-60">✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTargetTyping && (
              <div className="flex items-end space-x-2">
                <Avatar src={activeUser.profileImage} name={activeUser.firstName} size="w-7 h-7" />
                <div className="rounded-2xl rounded-bl-sm px-4 py-3 border" style={{ backgroundColor: 'var(--bubble-received-bg)', borderColor: 'var(--bubble-received-border)' }}>
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-muted)', animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-muted)', animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-muted)', animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* GIF Picker */}
          {showGifPicker && (
            <div className="absolute bottom-20 left-4 sm:left-6 z-40 w-72 sm:w-80 rounded-2xl p-4 space-y-3 border shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Select a GIF</h4>
                <button onClick={() => setShowGifPicker(false)} className="text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                {POPULAR_GIFS.map((gif, idx) => (
                  <img key={idx} src={gif} alt="gif" onClick={() => handleSendGif(gif)} className="rounded-xl h-24 w-full object-cover cursor-pointer hover:opacity-80 transition-opacity" />
                ))}
              </div>
            </div>
          )}

          {/* Emoji Picker */}
          {showEmoji && (
            <div className="absolute bottom-20 left-4 sm:left-6 z-40 rounded-2xl overflow-hidden border shadow-xl" style={{ borderColor: 'var(--border-color)' }}>
              <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={350} theme={isDark ? 'dark' : 'light'} />
            </div>
          )}

          {/* Composer Bar */}
          <div className="px-3 sm:px-4 py-3 border-t shrink-0" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>

            {/* Voice Recording UI */}
            {isRecordingVoice ? (
              <div className="flex items-center justify-between p-3 rounded-full border animate-pulse" style={{ backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent)' }}>
                <div className="flex items-center space-x-2 text-xs font-bold pl-2" style={{ color: 'var(--accent)' }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>Recording ({voiceDuration}s)...</span>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => stopVoiceRecording(true)} className="text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                    Cancel
                  </button>
                  <button onClick={() => stopVoiceRecording(false)} className="text-xs font-bold px-4 py-1.5 rounded-full shadow-md cursor-pointer text-white" style={{ backgroundColor: 'var(--accent)' }}>
                    Send 🎙️
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-1.5 sm:space-x-2">

                {/* Hidden file input */}
                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />

                {/* Attach */}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }} title="Upload Image">
                  📷
                </button>

                {/* GIF */}
                <button type="button" onClick={() => { setShowGifPicker(!showGifPicker); setShowEmoji(false); }} className="hidden sm:flex px-2.5 h-9 sm:h-10 rounded-full items-center justify-center text-[10px] font-black transition-colors cursor-pointer shrink-0" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                  GIF
                </button>

                {/* Emoji */}
                <button type="button" onClick={() => { setShowEmoji(!showEmoji); setShowGifPicker(false); }} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                  😊
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  placeholder={`Message ${activeUser.firstName}...`}
                  className="flex-1 min-w-0 rounded-full px-4 py-2.5 text-xs font-medium outline-none transition-colors border"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />

                {/* Voice */}
                <button type="button" onClick={startVoiceRecording} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }} title="Voice Note">
                  🎤
                </button>

                {/* Send */}
                <button type="submit" disabled={!inputMessage.trim()} className="h-9 sm:h-10 px-4 sm:px-5 rounded-full text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-40 text-white shrink-0" style={{ backgroundColor: 'var(--accent)' }}>
                  Send
                </button>
              </form>
            )}
          </div>

        </div>
      ) : (
        /* No Active Chat — Desktop Empty State */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ backgroundColor: 'var(--accent-light)' }}>
            💬
          </div>
          <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Select a conversation</h3>
          <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>
            Choose a match from the sidebar to chat, call, or share something fun.
          </p>
        </div>
      )}

      {/* Call Overlay */}
      <CallOverlay
        callState={callState}
        socket={socket}
        onEndCall={handleEndCall}
        onAcceptCall={handleAcceptCall}
        onDeclineCall={handleDeclineCall}
      />
    </div>
  );
};

export default Chat;
