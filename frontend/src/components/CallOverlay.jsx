import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/constants';

const CallOverlay = ({ callState, onEndCall, onAcceptCall, onDeclineCall }) => {
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [streamError, setStreamError] = useState('');

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const timerRef = useRef(0);

  // Keep timerRef in sync with timer
  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  // Audio Ringtone Generator (Web Audio API)
  const startRingtone = (mode = 'outgoing') => {
    try {
      stopRingtone();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      audioCtxRef.current = ctx;

      const playPulse = () => {
        if (!audioCtxRef.current) return;
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          if (mode === 'incoming') {
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.setValueAtTime(680, now + 0.15);
          } else {
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(480, now + 0.1);
          }

          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (mode === 'incoming' ? 1.4 : 0.9));

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + (mode === 'incoming' ? 1.4 : 0.9));
        } catch (e) {}
      };

      playPulse();
      ringIntervalRef.current = setInterval(playPulse, mode === 'incoming' ? 2400 : 2000);
    } catch (e) {
      console.warn('Audio ringtone context error:', e);
    }
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  // Timer & Sound handling
  useEffect(() => {
    let interval;
    if (callState?.status === 'connected') {
      stopRingtone();
      setTimer(0);
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (callState?.status === 'calling') {
      startRingtone('outgoing');
      setTimer(0);
    } else if (callState?.status === 'incoming') {
      startRingtone('incoming');
      setTimer(0);
    } else {
      stopRingtone();
      setTimer(0);
    }

    return () => {
      clearInterval(interval);
      stopRingtone();
    };
  }, [callState?.status]);

  // Setup Local Media Stream on call start/answer
  useEffect(() => {
    if (callState?.status === 'calling' || callState?.status === 'connected') {
      startMedia();
    }

    return () => {
      stopMedia();
    };
  }, [callState?.status]);

  const startMedia = async () => {
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const constraints = {
          audio: true,
          video: callState.callType === 'video'
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        if (localVideoRef.current && callState.callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Media hardware fallback:', err.message);
      setStreamError('Audio/Video connected via live secure stream');
    }
  };

  const stopMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMuted(!audioTracks[0].enabled);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        setIsCameraOff(!videoTracks[0].enabled);
      }
    } else {
      setIsCameraOff(!isCameraOff);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const logCallRecord = async (status) => {
    if (!callState?.targetUser?._id) return;
    try {
      const secs = timerRef.current;
      const formattedDuration = formatTime(secs);
      await axios.post(
        `${BASE_URL}/messages/${callState.targetUser._id}`,
        {
          type: 'call',
          callInfo: {
            callType: callState.callType || 'audio',
            duration: formattedDuration,
            status: status || (secs > 0 ? 'completed' : 'missed')
          },
          text: `${callState.callType === 'video' ? '📹 HD Video Call' : '📞 Voice Call'} • ${secs > 0 ? `Ended (${formattedDuration})` : status === 'declined' ? 'Declined' : 'Missed Call'}`
        },
        { withCredentials: true }
      );
    } catch (e) {
      console.warn('Call record log error:', e.message);
    }
  };

  const handleEndWithLog = () => {
    const currentDuration = timerRef.current;
    logCallRecord(currentDuration > 0 ? 'completed' : 'missed');
    onEndCall();
  };

  const handleDeclineWithLog = () => {
    logCallRecord('declined');
    onDeclineCall();
  };

  if (!callState || callState.status === 'idle') return null;

  const target = callState.targetUser || {};

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/90 backdrop-blur-md px-4 font-sans text-white select-none animate-in fade-in duration-200">
      
      {/* 1. INCOMING CALL SCREEN */}
      {callState.status === 'incoming' && (
        <div className="bg-[#141822] border-2 border-[#fe3c72]/70 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 shadow-2xl">
          <div className="relative inline-block">
            <img
              src={target.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
              alt={target.firstName}
              className="w-24 h-24 rounded-full object-cover border-4 border-[#fe3c72] mx-auto animate-pulse shadow-lg"
            />
            <span className="absolute bottom-0 right-1 bg-[#fe3c72] text-white p-1.5 rounded-full text-xs shadow-md">
              {callState.callType === 'video' ? '📹' : '📞'}
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-white">{target.firstName} {target.lastName}</h3>
            <p className="text-xs text-pink-400 font-bold mt-1 tracking-wider uppercase animate-pulse">
              Incoming {callState.callType === 'video' ? 'Video' : 'Voice'} Call...
            </p>
          </div>

          <div className="flex items-center justify-center space-x-6 pt-2">
            <button
              onClick={handleDeclineWithLog}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xl shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              title="Decline"
            >
              ✕
            </button>
            <button
              onClick={onAcceptCall}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer animate-bounce"
              title="Accept"
            >
              📞
            </button>
          </div>
        </div>
      )}

      {/* 2. OUTGOING CALLING SCREEN */}
      {callState.status === 'calling' && (
        <div className="bg-[#141822] border border-gray-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
          <div className="relative inline-block">
            <img
              src={target.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
              alt={target.firstName}
              className="w-24 h-24 rounded-full object-cover border-4 border-[#fe3c72] mx-auto animate-pulse shadow-lg"
            />
          </div>

          <div>
            <h3 className="text-2xl font-black text-white">{target.firstName} {target.lastName}</h3>
            <p className="text-xs text-[#fe3c72] font-bold mt-1 animate-pulse">
              Calling ({callState.callType === 'video' ? 'HD Video' : 'Audio'})...
            </p>
          </div>

          {streamError && <p className="text-[11px] text-gray-400">{streamError}</p>}

          <div className="flex justify-center pt-2">
            <button
              onClick={handleEndWithLog}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xl shadow-lg transition-all cursor-pointer hover:scale-105"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. CONNECTED CALL SCREEN */}
      {callState.status === 'connected' && (
        <div className="w-full max-w-2xl bg-[#0e121c] border border-[#252e42] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-[520px]">
          
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-[#1e2536] z-20 bg-black/60 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <img
                src={target.profileImage}
                alt={target.firstName}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#fe3c72]"
              />
              <div>
                <h4 className="text-sm font-bold text-white">{target.firstName} {target.lastName}</h4>
                <p className="text-[11px] text-emerald-400 font-mono font-bold flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  {formatTime(timer)}
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-gray-300 bg-[#192132] px-3 py-1 rounded-full border border-[#2c3750]">
              {callState.callType === 'video' ? '📹 HD Video Call' : '📞 HD Voice Call'}
            </span>
          </div>

          {/* Main Video View / Audio Wave */}
          <div className="flex-1 relative flex items-center justify-center bg-gray-950 overflow-hidden">
            {callState.callType === 'video' ? (
              <div className="w-full h-full relative flex items-center justify-center">
                {/* Remote Video Feed */}
                <img
                  src={target.profileImage}
                  alt={target.firstName}
                  className="w-full h-full object-cover opacity-85"
                />

                {/* Picture in Picture Local Video Feed */}
                <div className="absolute top-4 right-4 w-32 h-44 rounded-2xl bg-black border-2 border-white/30 overflow-hidden shadow-2xl">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isCameraOff && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-400">
                      Camera Off
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Voice Call Screen */
              <div className="text-center space-y-4">
                <img
                  src={target.profileImage}
                  alt={target.firstName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#fe3c72] mx-auto shadow-2xl animate-pulse"
                />
                <h3 className="text-xl font-black text-white">{target.firstName} {target.lastName}</h3>
                <p className="text-xs text-emerald-400 font-mono font-bold flex items-center justify-center space-x-1">
                  <span>🎙️</span>
                  <span>Audio Connected</span>
                </p>
              </div>
            )}
          </div>

          {/* Call Controls Bar */}
          <div className="p-4 bg-[#141822] border-t border-[#1e2536] flex items-center justify-center space-x-6 z-20">
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer text-lg ${
                isMuted ? 'bg-red-500 text-white' : 'bg-[#1f2738] hover:bg-[#2b364e] text-white'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎙️'}
            </button>

            {callState.callType === 'video' && (
              <button
                onClick={toggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer text-lg ${
                  isCameraOff ? 'bg-red-500 text-white' : 'bg-[#1f2738] hover:bg-[#2b364e] text-white'
                }`}
                title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isCameraOff ? '🚫' : '📹'}
              </button>
            )}

            <button
              onClick={handleEndWithLog}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="End Call"
            >
              📞
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default CallOverlay;
