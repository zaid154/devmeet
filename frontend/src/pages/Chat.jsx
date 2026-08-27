import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { BASE_URL } from '../utils/constants';

// Curated GIF Categories & Library
const GIF_CATEGORIES = [
  {
    id: 'trending',
    name: '🔥 Trending',
    gifs: [
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3Q4eGg2Y3h2N2FkNjR3OXJvZ3J2bDJ1dG96MDFob2ZlZTNubHZwZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKSjRrfIPjeiVyM/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHR1NnFsd3F3dTZ4NGZidG10NnJybWltM2hpeGZ0NXg0NXA5ZDNvOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0MYt5jPR6QX5pnqM/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3N2bzdrNHlhZmpzdnVibHR2dnlqd2g2MWU2OHBqdW9hMXc4cXRxeSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ICOgUNjpvO0PC/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpqd2ZlOG41cWVmd2hjcWZlZXk2NGcydnVsc214b2dqaHR0MmgxaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ASd0Ukj0y3qMM/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnV1cmg1anpsdDZlMnptdHpqNmtveXJ6MnBwNmtob3M1bWFpdDdtYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l3q2K5jinAlChoCLS/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGJ0cm9tdmYyZWh5MW1mMWl4anRqczIydzdrOW9ocG5xZHA1MnN2YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oz8xAFtqoOUUrsh7W/giphy.gif'
    ]
  },
  {
    id: 'romance',
    name: '💖 Romance',
    gifs: [
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdm9hOTJkMjJzZG1sdjFhc2kydGtzOHU5aXFjcWFudHkxdm4xMWo4eSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26FLdm964upJJaqCQ/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc29lOG50MjU0eDVpdTJsa21kMzJjcWZ0dHpkb3E2dm01ZGN6bnNkayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/M90mJvfWfd5mbUuULX/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdzM2czdpZXNldnlzd2Njc3YydmZ3cG5kYWc4cWNqc292cm8za2s3cyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lTQF0ODLLjhza/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzdxYmpjdnhqdWl6dTZmd2E4OHZ4bW1jYnRsa3M1N2V3eGhkdHpnMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26BRv0ThflsDTqUXa/giphy.gif'
    ]
  },
  {
    id: 'dev',
    name: '💻 Dev & Tech',
    gifs: [
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2RveDVkdG1rcnpxM2k2Y3M0OXdpOG85OHM2anQ3MWZtZDNocW5mciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ule4akeXnUSva/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWc1bXFwNzdyMXAxdWZldnh2N3psY3kxcGplOWVpbmphM2cxa20wZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/unQ3IJU2RG7DO/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3h0Y3Q0dXZqdzUzd3V4aWFjczZmaDNocmt1enp6enZlNWg4c2ZpcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/13HgwGsXF0aiGY/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnJ2dnVpY2FjdnprOHhsaXN2YnVndm0xMnN5bTN3ZnBrcWZ1NXhjayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/LmNwrBhejkK9EFP504/giphy.gif'
    ]
  },
  {
    id: 'funny',
    name: '🤣 Memes',
    gifs: [
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjlqb2s3OHZocjZtcHdtb29pOGEwazM1M2Uyc3lzdHZ1N2J0eTZ4cyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bC9czlgCMtw4cj8RgH/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjdrd3p4dWR6Mmp5dnVtdHpsdW5ldTZwbWFlazFlYm9xN2x4Mml0byZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xT0xeJpnrWC4XWblEk/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDY2anNnd3V1eGtpMmF3Ym0zd21wb2Zpd3JzNXo5bHVwNHZ3aG11ZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oEjHAUOqG3lSS0f1C/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYml3Y2hkbTV3dnJsaG9pZWNucTFpY3Vpd2N2YnkzbG44ajZucHJ3bSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/10JhviFuU2gWD6/giphy.gif'
    ]
  }
];

const ICEBREAKERS = [
  "Tabs or Spaces?",
  "What is your dream tech stack?",
  "Coffee or Energy Drink during late night deploys?",
  "What project are you most proud of?",
  "Dark theme or Light theme?"
];

// Clean Vector SVG Icons
const PhoneIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const VideoIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="3" ry="3" />
  </svg>
);

const MoreVerticalIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
);

const CameraIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const MicIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const SmileFaceIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <circle cx="9" cy="9" r="1" fill="currentColor" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
  </svg>
);

const SendPlaneIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const ShieldSecurityIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SearchIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

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
  const { socket, onlineUsers, sendMessage: sendSocketMessage, emitTyping, startCall } = useSocket();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(location.state?.targetUser || null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Media pickers & enhancements
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [activeGifTab, setActiveGifTab] = useState('trending');
  const [gifSearch, setGifSearch] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [isTargetTyping, setIsTargetTyping] = useState(false);
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState(null);

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

  // Socket listeners for messages and typing
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

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
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
    setIsUploadingMedia(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${BASE_URL}/upload`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status && (res.data.url || res.data.data?.mediaUrl)) {
        const imgUrl = res.data.url || res.data.data?.mediaUrl;
        handleSendMessage({ type: 'image', mediaUrl: imgUrl, text: '📷 Photo' });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          handleSendMessage({ type: 'image', mediaUrl: reader.result, text: '📷 Photo' });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSendMessage({ type: 'image', mediaUrl: reader.result, text: '📷 Photo' });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              <SearchIcon className="w-3.5 h-3.5" />
            </span>
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
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
            <ShieldSecurityIcon className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold leading-snug" style={{ color: 'var(--text-muted)' }}>
            Stay safe! Never share sensitive personal info or send money to someone you haven't met.
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
                onClick={() => startCall(activeUser, 'audio')}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:opacity-80 shadow-2xs border"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                title="Voice Call"
              >
                <PhoneIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => startCall(activeUser, 'video')}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:opacity-80 shadow-2xs border"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                title="Video Call"
              >
                <VideoIcon className="w-4 h-4" />
              </button>

              {/* Safety Menu */}
              <div className="relative" ref={safetyMenuRef}>
                <button
                  onClick={() => setShowSafetyMenu(!showSafetyMenu)}
                  className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:opacity-80 shadow-2xs border"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  title="More options"
                >
                  <MoreVerticalIcon className="w-4 h-4" />
                </button>
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
                    {/* Image Message (Click to view full screen) */}
                    {m.type === 'image' && m.mediaUrl && (
                      <div className="relative group cursor-pointer overflow-hidden rounded-xl">
                        <img
                          src={m.mediaUrl}
                          alt="Shared Photo"
                          onClick={() => setActiveLightbox(m.mediaUrl)}
                          className="rounded-xl max-h-64 w-full object-cover transition-transform group-hover:scale-102"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <span className="bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">🔍 Click to zoom</span>
                        </div>
                      </div>
                    )}

                    {/* GIF Message */}
                    {m.type === 'gif' && m.mediaUrl && (
                      <div className="relative group cursor-pointer overflow-hidden rounded-xl">
                        <img
                          src={m.mediaUrl}
                          alt="GIF"
                          onClick={() => setActiveLightbox(m.mediaUrl)}
                          className="rounded-xl max-h-56 w-full object-cover transition-transform group-hover:scale-102"
                        />
                      </div>
                    )}

                    {/* Voice Note */}
                    {m.type === 'voice_note' && m.mediaUrl && (
                      <div className="flex items-center space-x-2 py-1">
                        <MicIcon className="w-4 h-4 text-emerald-500" />
                        <audio src={m.mediaUrl} controls className="h-8 max-w-[200px]" style={{ filter: isMine ? 'invert(1) brightness(2)' : isDark ? 'invert(1) brightness(1.5)' : 'none' }} />
                      </div>
                    )}

                    {/* Call Record Item */}
                    {m.type === 'call' && (
                      <div className="flex items-center space-x-2.5 py-1 px-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          m.callInfo?.status === 'missed' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {m.callInfo?.callType === 'video' ? '📹' : '📞'}
                        </div>
                        <div>
                          <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                            {m.callInfo?.callType === 'video' ? 'HD Video Call' : 'Voice Call'}
                          </p>
                          <p className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                            {m.callInfo?.status === 'missed' ? 'Missed Call' : m.callInfo?.status === 'declined' ? 'Declined' : `Call Ended • ${m.callInfo?.duration || m.duration || '0:00'}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Text */}
                    {m.text && m.type !== 'gif' && m.type !== 'call' && <p className="text-[13px] font-medium leading-relaxed break-words">{m.text}</p>}

                    {/* Timestamp + Read */}
                    <div className={`flex items-center space-x-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] font-medium opacity-70">{formatMessageTime(m.createdAt)}</span>
                      {isMine && <span className="text-[9px] opacity-60">✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Uploading Media Indicator */}
            {isUploadingMedia && (
              <div className="flex justify-end items-center space-x-2">
                <div className="rounded-2xl px-4 py-2.5 flex items-center space-x-2 border shadow-xs" style={{ backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent)' }}>
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                  <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Uploading photo...</span>
                </div>
              </div>
            )}

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

          {/* Advanced Multi-Category GIF Picker */}
          {showGifPicker && (
            <div className="absolute bottom-20 left-4 sm:left-6 z-40 w-80 sm:w-96 rounded-2xl p-4 space-y-3 border shadow-2xl animate-in zoom-in-95" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between items-center pb-1 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Select Animated GIF</h4>
                <button onClick={() => setShowGifPicker(false)} className="text-xs font-bold p-1 hover:opacity-70 cursor-pointer" style={{ color: 'var(--text-muted)' }}>✕</button>
              </div>

              {/* Category Pills */}
              <div className="flex space-x-1.5 overflow-x-auto pb-1">
                {GIF_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveGifTab(cat.id); setGifSearch(''); }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                      activeGifTab === cat.id ? 'text-white' : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: activeGifTab === cat.id ? 'var(--accent)' : 'var(--bg-input)',
                      borderColor: activeGifTab === cat.id ? 'var(--accent)' : 'var(--border-color)',
                      color: activeGifTab === cat.id ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* GIF Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {(GIF_CATEGORIES.find(c => c.id === activeGifTab)?.gifs || []).map((gif, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSendGif(gif)}
                    className="relative group rounded-xl overflow-hidden h-28 bg-black/5 cursor-pointer border border-transparent hover:border-[#fe3c72] transition-all"
                  >
                    <img src={gif} alt="GIF" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-black text-white bg-[#fe3c72] px-2 py-0.5 rounded-full shadow-xs">Send ✈️</span>
                    </div>
                  </div>
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

                {/* Attach Photo */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 hover:opacity-80 border"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                  title="Upload Image"
                >
                  <CameraIcon className="w-4 h-4" />
                </button>

                {/* GIF */}
                <button
                  type="button"
                  onClick={() => { setShowGifPicker(!showGifPicker); setShowEmoji(false); }}
                  className="hidden sm:flex px-2.5 h-9 sm:h-10 rounded-full items-center justify-center text-[11px] font-black tracking-wider transition-colors cursor-pointer shrink-0 hover:opacity-80 border"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  GIF
                </button>

                {/* Emoji */}
                <button
                  type="button"
                  onClick={() => { setShowEmoji(!showEmoji); setShowGifPicker(false); }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 hover:opacity-80 border"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                  title="Insert Emoji"
                >
                  <SmileFaceIcon className="w-4 h-4" />
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

                {/* Voice Note */}
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 hover:opacity-80 border"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                  title="Voice Note"
                >
                  <MicIcon className="w-4 h-4" />
                </button>

                {/* Send */}
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="h-9 sm:h-10 px-4 sm:px-5 rounded-full text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-40 text-white shrink-0 flex items-center space-x-1.5"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <span>Send</span>
                  <SendPlaneIcon className="w-3.5 h-3.5" />
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

      {/* Fullscreen Image/GIF Lightbox Modal */}
      {activeLightbox && (
        <div
          onClick={() => setActiveLightbox(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeLightbox}
              alt="Full view"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            <div className="flex items-center space-x-3 mt-4">
              <a
                href={activeLightbox}
                target="_blank"
                rel="noopener noreferrer"
                download="devmeet-media"
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-xs transition-colors flex items-center space-x-1.5"
              >
                <span>⬇️ Open Original</span>
              </a>
              <button
                onClick={() => setActiveLightbox(null)}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-xs transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Chat;
