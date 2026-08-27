import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/constants';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ]
};

const CallOverlay = ({ callState, socket, callerInfo, onEndCall, onAcceptCall, onDeclineCall }) => {
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [permError, setPermError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const iceCandidateQueue = useRef([]);
  const callerInitialized = useRef(false);

  const audioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const timerRef = useRef(0);
  const timerIntervalRef = useRef(null);

  useEffect(() => { timerRef.current = timer; }, [timer]);

  // ─── Ringtone ───
  const startRingtone = useCallback((mode) => {
    try {
      stopRingtone();
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume();
      audioCtxRef.current = ctx;

      const pulse = () => {
        if (!audioCtxRef.current) return;
        try {
          const n = ctx.currentTime;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(mode === 'incoming' ? 520 : 440, n);
          o.frequency.setValueAtTime(mode === 'incoming' ? 680 : 480, n + 0.12);
          g.gain.setValueAtTime(0.22, n);
          g.gain.exponentialRampToValueAtTime(0.001, n + (mode === 'incoming' ? 1.3 : 0.85));
          o.connect(g); g.connect(ctx.destination);
          o.start(n); o.stop(n + (mode === 'incoming' ? 1.3 : 0.85));
        } catch (_) {}
      };
      pulse();
      ringIntervalRef.current = setInterval(pulse, mode === 'incoming' ? 2400 : 2000);
    } catch (_) {}
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringIntervalRef.current) { clearInterval(ringIntervalRef.current); ringIntervalRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (_) {} audioCtxRef.current = null; }
  }, []);

  // ─── Timer & Ringtone ───
  useEffect(() => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }

    const status = callState?.status;
    if (status === 'connected') {
      stopRingtone(); setTimer(0);
      timerIntervalRef.current = setInterval(() => setTimer(p => p + 1), 1000);
    } else if (status === 'calling') {
      startRingtone('outgoing'); setTimer(0);
    } else if (status === 'incoming') {
      startRingtone('incoming'); setTimer(0);
    } else {
      stopRingtone(); setTimer(0);
    }
    return () => {
      if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
      stopRingtone();
    };
  }, [callState?.status]);

  // ─── Cleanup ───
  const cleanup = useCallback(() => {
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (pcRef.current) { try { pcRef.current.close(); } catch (_) {} pcRef.current = null; }
    iceCandidateQueue.current = [];
    callerInitialized.current = false;
    setPermError('');
  }, []);

  // ─── Get user media with permission error handling ───
  const getMedia = useCallback(async (callType) => {
    const constraints = {
      audio: true,
      video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
    };
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermError(`⚠️ ${callType === 'video' ? 'Camera & Microphone' : 'Microphone'} permission denied. Please allow in browser settings and try again.`);
      } else if (err.name === 'NotFoundError') {
        setPermError(`⚠️ ${callType === 'video' ? 'Camera or Microphone' : 'Microphone'} not found on this device.`);
      }
      // Fallback to audio only for video calls
      if (callType === 'video') {
        try { return await navigator.mediaDevices.getUserMedia({ audio: true, video: false }); } catch (_) {}
      }
      throw err;
    }
  }, []);

  // ─── Attach remote stream to audio/video elements ───
  const attachRemoteStream = useCallback((remoteStream, callType) => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => {});
    }
    if (remoteVideoRef.current && callType === 'video') {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, []);

  // ─── CALLER: Create offer and emit via socket ───
  useEffect(() => {
    if (callState?.status !== 'calling' || !socket || !callState?.targetUser?._id) return;
    if (callerInitialized.current) return; // prevent double init
    callerInitialized.current = true;

    const initCaller = async () => {
      try {
        const stream = await getMedia(callState.callType);
        localStreamRef.current = stream;
        if (localVideoRef.current && callState.callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          const [rs] = event.streams;
          if (rs) attachRemoteStream(rs, callState.callType);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', { targetUserId: callState.targetUser._id, candidate: event.candidate });
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('call-offer', {
          targetUserId: callState.targetUser._id,
          offer: pc.localDescription,
          callerInfo: callerInfo || {},
          callType: callState.callType
        });
      } catch (err) {
        console.error('Caller init error:', err);
      }
    };

    initCaller();
  }, [callState?.status, callState?.targetUser?._id, socket]);

  // ─── Socket listeners for caller: answer + ICE ───
  useEffect(() => {
    if (!socket) return;

    const onAnswered = async ({ answer }) => {
      const pc = pcRef.current;
      if (pc && answer && pc.signalingState === 'have-local-offer') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          for (const c of iceCandidateQueue.current) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
          }
          iceCandidateQueue.current = [];
        } catch (e) { console.warn('setRemoteDescription error:', e); }
      }
    };

    const onIce = async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc || !candidate) return;
      if (pc.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
      } else {
        iceCandidateQueue.current.push(candidate);
      }
    };

    socket.on('call-answered', onAnswered);
    socket.on('ice-candidate', onIce);
    return () => { socket.off('call-answered', onAnswered); socket.off('ice-candidate', onIce); };
  }, [socket]);

  // ─── Cleanup on idle ───
  useEffect(() => {
    if (!callState || callState.status === 'idle') cleanup();
  }, [callState?.status, cleanup]);

  // ─── RECEIVER: Accept call ───
  const handleAcceptCall = async () => {
    try {
      const stream = await getMedia(callState.callType);
      localStreamRef.current = stream;
      if (localVideoRef.current && callState.callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        const [rs] = event.streams;
        if (rs) attachRemoteStream(rs, callState.callType);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && callState.targetUser?._id) {
          socket.emit('ice-candidate', { targetUserId: callState.targetUser._id, candidate: event.candidate });
        }
      };

      if (callState.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callState.offer));
        for (const c of iceCandidateQueue.current) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
        }
        iceCandidateQueue.current = [];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call-answer', {
        targetUserId: callState.targetUser._id,
        answer: pc.localDescription
      });

      onAcceptCall(); // Update UI to 'connected'
    } catch (err) {
      console.error('Accept call error:', err);
      onAcceptCall();
    }
  };

  // ─── Controls ───
  const toggleMute = () => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getAudioTracks();
      if (t.length) { t[0].enabled = !t[0].enabled; setIsMuted(!t[0].enabled); }
    } else setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getVideoTracks();
      if (t.length) { t[0].enabled = !t[0].enabled; setIsCameraOff(!t[0].enabled); }
    } else setIsCameraOff(!isCameraOff);
  };

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const logCallRecord = async (status) => {
    if (!callState?.targetUser?._id) return;
    try {
      const s = timerRef.current; const d = fmt(s);
      await axios.post(`${BASE_URL}/messages/${callState.targetUser._id}`, {
        type: 'call',
        callInfo: { callType: callState.callType || 'audio', duration: d, status: status || (s > 0 ? 'completed' : 'missed') },
        text: `${callState.callType === 'video' ? '📹 Video Call' : '📞 Voice Call'} • ${s > 0 ? `Ended (${d})` : status === 'declined' ? 'Declined' : 'Missed Call'}`
      }, { withCredentials: true });
    } catch (_) {}
  };

  const handleEnd = () => { logCallRecord(timerRef.current > 0 ? 'completed' : 'missed'); cleanup(); onEndCall(); };
  const handleDecline = () => { logCallRecord('declined'); cleanup(); onDeclineCall(); };

  if (!callState || callState.status === 'idle') return null;
  const target = callState.targetUser || {};

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/90 backdrop-blur-md px-4 font-sans text-white select-none">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Permission error banner */}
      {permError && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xl z-50 max-w-sm text-center">
          {permError}
        </div>
      )}

      {/* ── INCOMING ── */}
      {callState.status === 'incoming' && (
        <div className="bg-[#141822] border-2 border-[#fe3c72]/70 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
          <div className="relative inline-block">
            <img src={target.profileImage || 'https://via.placeholder.com/150'} alt={target.firstName}
              className="w-24 h-24 rounded-full object-cover border-4 border-[#fe3c72] mx-auto animate-pulse shadow-lg" />
            <span className="absolute bottom-0 right-1 bg-[#fe3c72] text-white p-1.5 rounded-full text-xs shadow-md">
              {callState.callType === 'video' ? '📹' : '📞'}
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-black">{target.firstName} {target.lastName}</h3>
            <p className="text-xs text-pink-400 font-bold mt-1 uppercase animate-pulse">
              Incoming {callState.callType === 'video' ? 'Video' : 'Voice'} Call...
            </p>
          </div>
          <div className="flex items-center justify-center space-x-6 pt-2">
            <button onClick={handleDecline} className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xl shadow-lg cursor-pointer">✕</button>
            <button onClick={handleAcceptCall} className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-lg cursor-pointer animate-bounce">📞</button>
          </div>
        </div>
      )}

      {/* ── CALLING ── */}
      {callState.status === 'calling' && (
        <div className="bg-[#141822] border border-gray-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
          <img src={target.profileImage || 'https://via.placeholder.com/150'} alt={target.firstName}
            className="w-24 h-24 rounded-full object-cover border-4 border-[#fe3c72] mx-auto animate-pulse shadow-lg" />
          <div>
            <h3 className="text-2xl font-black">{target.firstName} {target.lastName}</h3>
            <p className="text-xs text-[#fe3c72] font-bold mt-1 animate-pulse">
              Calling ({callState.callType === 'video' ? 'HD Video' : 'Audio'})...
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <button onClick={handleEnd} className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xl shadow-lg cursor-pointer">✕</button>
          </div>
        </div>
      )}

      {/* ── CONNECTED ── */}
      {callState.status === 'connected' && (
        <div className="w-full max-w-2xl bg-[#0e121c] border border-[#252e42] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-[520px]">
          <div className="p-4 flex items-center justify-between border-b border-[#1e2536] z-20 bg-black/60 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <img src={target.profileImage} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#fe3c72]" />
              <div>
                <h4 className="text-sm font-bold">{target.firstName} {target.lastName}</h4>
                <p className="text-[11px] text-emerald-400 font-mono font-bold flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>{fmt(timer)}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-gray-300 bg-[#192132] px-3 py-1 rounded-full border border-[#2c3750]">
              {callState.callType === 'video' ? '📹 HD Video' : '📞 HD Voice'}
            </span>
          </div>
          <div className="flex-1 relative flex items-center justify-center bg-gray-950 overflow-hidden">
            {callState.callType === 'video' ? (
              <div className="w-full h-full relative">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 w-32 h-44 rounded-2xl bg-black border-2 border-white/30 overflow-hidden shadow-2xl">
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {isCameraOff && <div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-400">Camera Off</div>}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <img src={target.profileImage} alt="" className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500 mx-auto shadow-2xl animate-pulse" />
                  <span className="absolute bottom-1 right-2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0e121c] flex items-center justify-center text-xs">🎙️</span>
                </div>
                <h3 className="text-xl font-black">{target.firstName} {target.lastName}</h3>
                <p className="text-xs text-emerald-400 font-mono font-bold flex items-center justify-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span>Live HD Audio</span>
                </p>
              </div>
            )}
          </div>
          <div className="p-4 bg-[#141822] border-t border-[#1e2536] flex items-center justify-center space-x-6 z-20">
            <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer text-lg ${isMuted ? 'bg-red-500' : 'bg-[#1f2738] hover:bg-[#2b364e]'} text-white`}>
              {isMuted ? '🔇' : '🎙️'}
            </button>
            {callState.callType === 'video' && (
              <button onClick={toggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer text-lg ${isCameraOff ? 'bg-red-500' : 'bg-[#1f2738] hover:bg-[#2b364e]'} text-white`}>
                {isCameraOff ? '🚫' : '📹'}
              </button>
            )}
            <button onClick={handleEnd} className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xl shadow-lg cursor-pointer">📞</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallOverlay;
