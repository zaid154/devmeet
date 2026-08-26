import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CallOverlay from '../components/CallOverlay';

// Curated top GIFs for instant search
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

const Chat = () => {
  const { user } = useAuth();
  const { socket, onlineUsers, sendMessage: sendSocketMessage, emitTyping } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(location.state?.targetUser || null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Media pickers
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);

  // Typing state
  const [isTargetTyping, setIsTargetTyping] = useState(false);

  // Call state
  const [callState, setCallState] = useState({
    status: 'idle', // 'idle' | 'calling' | 'incoming' | 'connected'
    targetUser: null,
    callType: 'audio' // 'audio' | 'video'
  });

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeUser?._id) {
      fetchMessages(activeUser._id);
    }
  }, [activeUser]);

  // Real-time Socket Event Listeners
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
      if (senderId === activeUser?._id) {
        setIsTargetTyping(isTyping);
      }
    };

    const handleIncomingCall = ({ callerInfo, callType }) => {
      setCallState({
        status: 'incoming',
        targetUser: callerInfo,
        callType: callType || 'audio'
      });
    };

    const handleCallAnswered = () => {
      setCallState((prev) => ({ ...prev, status: 'connected' }));
    };

    const handleCallRejected = () => {
      setCallState({ status: 'idle', targetUser: null, callType: 'audio' });
      alert('Call declined.');
    };

    const handleCallEnded = () => {
      setCallState({ status: 'idle', targetUser: null, callType: 'audio' });
    };

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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    }
  };

  const fetchMessages = async (targetId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/messages/${targetId}`, { withCredentials: true });
      if (res.data.status) {
        setMessages(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (payloadOverride) => {
    if (!activeUser?._id) return;

    const payload = payloadOverride || {
      text: inputMessage.trim(),
      type: 'text'
    };

    if (!payload.text && !payload.mediaUrl && payload.type === 'text') return;

    if (!payloadOverride) setInputMessage('');
    setShowEmoji(false);
    setShowGifPicker(false);
    emitTyping(activeUser._id, false);

    try {
      const res = await axios.post(
        `${BASE_URL}/messages/${activeUser._id}`,
        payload,
        { withCredentials: true }
      );

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
    if (activeUser?._id) {
      emitTyping(activeUser._id, e.target.value.length > 0);
    }
  };

  const onEmojiClick = (emojiData) => {
    setInputMessage((prev) => prev + emojiData.emoji);
  };

  const handleSendGif = (gifUrl) => {
    handleSendMessage({
      type: 'gif',
      mediaUrl: gifUrl,
      text: 'GIF'
    });
  };

  // Image Upload
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
        handleSendMessage({
          type: 'image',
          mediaUrl: res.data.url,
          text: '📷 Photo'
        });
      }
    } catch (err) {
      alert('Failed to upload image');
    }
  };

  // Voice Note Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
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
            handleSendMessage({
              type: 'voice_note',
              mediaUrl: res.data.url,
              duration: voiceDuration,
              text: '🎤 Voice Note'
            });
          }
        } catch (e) {
          console.error(e);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecordingVoice(true);
      setVoiceDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setVoiceDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      alert('Microphone permission required for voice notes');
    }
  };

  const stopVoiceRecording = (cancel = false) => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingVoice(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (cancel) {
        mediaRecorderRef.current.stop();
        audioChunksRef.current = [];
      } else {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // Calls
  const startCall = (callType) => {
    if (!activeUser?._id) return;
    setCallState({
      status: 'calling',
      targetUser: activeUser,
      callType
    });

    if (socket) {
      socket.emit('call-offer', {
        targetUserId: activeUser._id,
        callerInfo: user,
        callType
      });
    }
  };

  const handleEndCall = () => {
    if (socket && callState.targetUser?._id) {
      socket.emit('call-end', { targetUserId: callState.targetUser._id });
    }
    setCallState({ status: 'idle', targetUser: null, callType: 'audio' });
  };

  const handleAcceptCall = () => {
    setCallState((prev) => ({ ...prev, status: 'connected' }));
    if (socket && callState.targetUser?._id) {
      socket.emit('call-answer', { targetUserId: callState.targetUser._id });
    }
  };

  const handleDeclineCall = () => {
    if (socket && callState.targetUser?._id) {
      socket.emit('call-reject', { targetUserId: callState.targetUser._id });
    }
    setCallState({ status: 'idle', targetUser: null, callType: 'audio' });
  };

  // Safety actions
  const handleUnmatch = async () => {
    if (window.confirm(`Are you sure you want to unmatch with ${activeUser.firstName}?`)) {
      try {
        await axios.post(`${BASE_URL}/unmatch/${activeUser._id}`, {}, { withCredentials: true });
        setActiveUser(null);
        fetchConversations();
      } catch (e) {
        alert('Failed to unmatch');
      }
    }
  };

  const handleBlock = async () => {
    if (window.confirm(`Block ${activeUser.firstName}? They won't be able to message or see your profile.`)) {
      try {
        await axios.post(`${BASE_URL}/block/${activeUser._id}`, {}, { withCredentials: true });
        setActiveUser(null);
        fetchConversations();
      } catch (e) {
        alert('Failed to block user');
      }
    }
  };

  const filteredConversations = conversations.filter(c => 
    `${c.user?.firstName} ${c.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isOnline = activeUser ? onlineUsers.has(activeUser._id) : false;

  return (
    <div className="h-screen bg-gray-50 flex pt-16 font-sans text-gray-900 overflow-hidden">
      
      {/* Sidebar: Match Threads */}
      <div className={`${activeUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 bg-white border-r border-gray-100 flex-col h-full shrink-0`}>
        
        {/* Sidebar Header */}
        <div className="p-3.5 sm:p-4 border-b border-gray-100 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black tracking-tight">Messages</h2>
            <span className="text-xs font-bold text-[#fe3c72] bg-red-50 px-2.5 py-1 rounded-full">
              {conversations.length} Matches
            </span>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#fe3c72]"
          />
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-gray-400">
              No conversations yet. Match with developers to start chatting!
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
                  className={`p-3.5 flex items-center space-x-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-red-50/50 border-l-4 border-[#fe3c72]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                      alt={u.firstName}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover"
                    />
                    {userOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-xs font-bold truncate text-gray-900">{u.firstName} {u.lastName}</h4>
                      {c.lastMessage && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                      {c.lastMessage?.text || 'Started a conversation'}
                    </p>
                  </div>

                  {c.unreadCount > 0 && (
                    <span className="bg-[#fe3c72] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Main Chat Area */}
      {activeUser ? (
        <div className="flex-1 flex flex-col h-full bg-white relative w-full">
          
          {/* Chat Header */}
          <div className="px-3 sm:px-6 py-3 border-b border-gray-100 flex items-center justify-between shadow-xs bg-white z-10">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              
              {/* Mobile Back Button */}
              <button
                onClick={() => setActiveUser(null)}
                className="md:hidden p-1.5 -ml-1 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                title="Back to messages"
              >
                &larr;
              </button>

              <Link to={`/profile/${activeUser._id}`} className="relative group shrink-0">
                <img
                  src={activeUser.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                  alt={activeUser.firstName}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border group-hover:border-[#fe3c72] transition-colors"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                )}
              </Link>

              <div className="min-w-0">
                <Link to={`/profile/${activeUser._id}`} className="text-sm font-black hover:text-[#fe3c72] transition-colors flex items-center space-x-1.5">
                  <span>{activeUser.firstName} {activeUser.lastName}</span>
                  {activeUser.isVerified && <span className="text-blue-500 text-[10px]">✓</span>}
                </Link>
                <p className="text-[11px] text-gray-400 font-semibold flex items-center">
                  {isTargetTyping ? (
                    <span className="text-[#fe3c72] font-bold animate-pulse">Typing...</span>
                  ) : isOnline ? (
                    <span className="text-emerald-600 font-bold">Online</span>
                  ) : (
                    'Offline'
                  )}
                </p>
              </div>
            </div>

            {/* Header Call & Safety Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => startCall('audio')}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-50 hover:text-[#fe3c72] flex items-center justify-center text-sm transition-colors cursor-pointer"
                title="Voice Call"
              >
                📞
              </button>

              <button
                onClick={() => startCall('video')}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-50 hover:text-[#fe3c72] flex items-center justify-center text-sm transition-colors cursor-pointer"
                title="Video Call"
              >
                📹
              </button>

              <div className="relative group">
                <button className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 cursor-pointer">
                  •••
                </button>
                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 text-xs font-bold hidden group-hover:block z-30">
                  <button onClick={handleUnmatch} className="w-full text-left p-2 hover:bg-red-50 text-red-500 rounded-xl cursor-pointer">
                    💔 Unmatch
                  </button>
                  <button onClick={handleBlock} className="w-full text-left p-2 hover:bg-red-50 text-red-600 rounded-xl cursor-pointer">
                    🚫 Block User
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Messages Bubble Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
            {/* Icebreakers Pill Bar */}
            {messages.length === 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 text-center space-y-3 max-w-md mx-auto my-6">
                <span className="text-3xl">💬</span>
                <h4 className="text-sm font-black">Say Hello to {activeUser.firstName}!</h4>
                <p className="text-xs text-gray-500">Pick an icebreaker to get the conversation rolling:</p>
                <div className="flex flex-col space-y-2 pt-1">
                  {ICEBREAKERS.map((ice, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage({ text: ice, type: 'text' })}
                      className="bg-red-50 hover:bg-red-100 text-[#fe3c72] text-xs font-bold py-2 px-4 rounded-full transition-colors text-left"
                    >
                      💡 {ice}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => {
              const isMine = (m.senderId?._id || m.senderId) === user?._id;

              return (
                <div key={m._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] sm:max-w-[65%] rounded-3xl p-3.5 space-y-1 shadow-xs ${
                    isMine ? 'bg-[#fe3c72] text-white rounded-br-xs' : 'bg-white text-gray-900 border border-gray-100 rounded-bl-xs'
                  }`}>
                    
                    {/* Image Message */}
                    {m.type === 'image' && m.mediaUrl && (
                      <img
                        src={m.mediaUrl}
                        alt="Shared"
                        className="rounded-2xl max-h-60 w-full object-cover cursor-pointer mb-1"
                      />
                    )}

                    {/* GIF Message */}
                    {m.type === 'gif' && m.mediaUrl && (
                      <img
                        src={m.mediaUrl}
                        alt="GIF"
                        className="rounded-2xl max-h-52 w-full object-cover mb-1"
                      />
                    )}

                    {/* Voice Note Audio Player */}
                    {m.type === 'voice_note' && m.mediaUrl && (
                      <div className="flex items-center space-x-2 py-1">
                        <audio src={m.mediaUrl} controls className="w-48 h-8 rounded-full" />
                      </div>
                    )}

                    {/* Text Message */}
                    {m.text && <p className="text-xs font-medium leading-relaxed break-words">{m.text}</p>}

                    {/* Timestamp */}
                    <span className={`text-[9px] block text-right font-medium opacity-70 ${isMine ? 'text-white' : 'text-gray-400'}`}>
                      {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* GIF Picker Modal */}
          {showGifPicker && (
            <div className="absolute bottom-20 left-6 z-40 bg-white p-4 rounded-3xl shadow-2xl border border-gray-100 w-80 space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center pb-1">
                <h4 className="text-xs font-bold text-gray-500 uppercase">Select a GIF</h4>
                <button onClick={() => setShowGifPicker(false)} className="text-gray-400 text-xs">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {POPULAR_GIFS.map((gif, idx) => (
                  <img
                    key={idx}
                    src={gif}
                    alt="gif option"
                    onClick={() => handleSendGif(gif)}
                    className="rounded-xl h-24 w-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Emoji Picker Modal */}
          {showEmoji && (
            <div className="absolute bottom-20 left-6 z-40 shadow-2xl rounded-3xl overflow-hidden border border-gray-100 animate-in fade-in">
              <EmojiPicker onEmojiClick={onEmojiClick} width={320} height={380} />
            </div>
          )}

          {/* Chat Composer Bar */}
          <div className="p-4 bg-white border-t border-gray-100 relative">
            
            {/* Voice Recording Active UI */}
            {isRecordingVoice ? (
              <div className="flex items-center justify-between bg-red-50 p-3 rounded-full border border-red-100 animate-pulse">
                <div className="flex items-center space-x-2 text-xs font-bold text-red-600 pl-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                  <span>Recording Voice Note ({voiceDuration}s)...</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => stopVoiceRecording(true)}
                    className="bg-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => stopVoiceRecording(false)}
                    className="bg-[#fe3c72] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md cursor-pointer"
                  >
                    Send Voice 🎙️
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-2">
                
                {/* Image Upload Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                {/* + Attach Image button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors cursor-pointer text-base"
                  title="Upload Image"
                >
                  📷
                </button>

                {/* GIF Button */}
                <button
                  type="button"
                  onClick={() => { setShowGifPicker(!showGifPicker); setShowEmoji(false); }}
                  className="px-3 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-black text-gray-600 transition-colors cursor-pointer"
                >
                  GIF
                </button>

                {/* Emoji Button */}
                <button
                  type="button"
                  onClick={() => { setShowEmoji(!showEmoji); setShowGifPicker(false); }}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer text-base"
                >
                  😊
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  placeholder={`Message ${activeUser.firstName}...`}
                  className="flex-1 bg-gray-50 border border-gray-200 focus:border-[#fe3c72] rounded-full px-4 py-2.5 text-xs outline-none transition-colors"
                />

                {/* Voice Note Button */}
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-red-50 hover:text-[#fe3c72] flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                  title="Record Voice Note"
                >
                  🎤
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="bg-[#fe3c72] hover:bg-[#e03463] text-white font-bold px-5 h-10 rounded-full text-xs shadow-md transition-all cursor-pointer disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            )}

          </div>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-3">
          <span className="text-4xl">💬</span>
          <h3 className="text-lg font-black text-gray-700">Select a Match</h3>
          <p className="text-xs text-gray-500 max-w-xs">
            Choose a conversation from the sidebar to chat, voice call, or video call with your matches.
          </p>
        </div>
      )}

      {/* WebRTC Video / Voice Call Overlay */}
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
