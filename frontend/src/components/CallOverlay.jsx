import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

const CallOverlay = ({ callState, onEndCall, onAcceptCall, onDeclineCall, socket }) => {
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [streamError, setStreamError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // Timer
  useEffect(() => {
    let interval;
    if (callState.status === 'connected') {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [callState.status]);

  // Setup Local Media Stream on call start/answer
  useEffect(() => {
    if (callState.status === 'calling' || callState.status === 'connected') {
      startMedia();
    }

    return () => {
      stopMedia();
    };
  }, [callState.status]);

  const startMedia = async () => {
    try {
      const constraints = {
        audio: true,
        video: callState.callType === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && callState.callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Media error:', err);
      setStreamError('Permission denied for camera/microphone.');
    }
  };

  const stopMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMuted(!audioTracks[0].enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        setIsCameraOff(!videoTracks[0].enabled);
      }
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!callState || callState.status === 'idle') return null;

  const target = callState.targetUser || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4 font-sans text-white">
      
      {/* 1. INCOMING CALL SCREEN */}
      {callState.status === 'incoming' && (
        <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 shadow-2xl">
          <div className="relative inline-block">
            <img
              src={target.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
              alt={target.firstName}
              className="w-24 h-24 rounded-full object-cover border-4 border-[#fe3c72] mx-auto animate-pulse"
            />
            <span className="absolute bottom-0 right-1 bg-[#fe3c72] text-white p-1 rounded-full text-xs">
              {callState.callType === 'video' ? '📹' : '📞'}
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black">{target.firstName} {target.lastName}</h3>
            <p className="text-xs text-gray-400 mt-1">
              Incoming {callState.callType === 'video' ? 'Video' : 'Voice'} Call...
            </p>
          </div>

          <div className="flex items-center justify-center space-x-6 pt-2">
            <button
              onClick={onDeclineCall}
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
        <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
          <div className="relative inline-block">
            <img
              src={target.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
              alt={target.firstName}
              className="w-24 h-24 rounded-full object-cover border-4 border-[#fe3c72] mx-auto animate-pulse"
            />
          </div>

          <div>
            <h3 className="text-2xl font-black">{target.firstName} {target.lastName}</h3>
            <p className="text-xs text-[#fe3c72] font-bold mt-1 animate-pulse">Ringing...</p>
          </div>

          {streamError && <p className="text-xs text-red-400">{streamError}</p>}

          <div className="flex justify-center pt-2">
            <button
              onClick={onEndCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xl shadow-lg transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. CONNECTED CALL SCREEN */}
      {callState.status === 'connected' && (
        <div className="w-full max-w-2xl bg-[#111418] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-[520px]">
          
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-gray-800/60 z-20 bg-black/40 backdrop-blur-xs">
            <div className="flex items-center space-x-3">
              <img
                src={target.profileImage}
                alt={target.firstName}
                className="w-10 h-10 rounded-full object-cover border border-[#fe3c72]"
              />
              <div>
                <h4 className="text-sm font-bold">{target.firstName} {target.lastName}</h4>
                <p className="text-[11px] text-emerald-400 font-mono font-bold flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  {formatTime(timer)}
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-gray-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
              {callState.callType === 'video' ? '📹 HD Video' : '📞 Voice'}
            </span>
          </div>

          {/* Main Video View / Audio Wave */}
          <div className="flex-1 relative flex items-center justify-center bg-gray-950 overflow-hidden">
            {callState.callType === 'video' ? (
              <div className="w-full h-full relative flex items-center justify-center">
                {/* Simulated / Remote Video */}
                <img
                  src={target.profileImage}
                  alt={target.firstName}
                  className="w-full h-full object-cover opacity-80"
                />

                {/* Picture in Picture Local Video Feed */}
                <div className="absolute top-4 right-4 w-32 h-44 rounded-2xl bg-black border-2 border-white/20 overflow-hidden shadow-2xl">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isCameraOff && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-xs font-bold text-gray-400">
                      Camera Off
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Voice Call Big Avatar Screen */
              <div className="text-center space-y-4">
                <img
                  src={target.profileImage}
                  alt={target.firstName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#fe3c72] mx-auto shadow-2xl animate-pulse"
                />
                <h3 className="text-xl font-black">{target.firstName} {target.lastName}</h3>
                <p className="text-xs text-emerald-400 font-mono font-bold">Voice Call Active</p>
              </div>
            )}
          </div>

          {/* Call Controls Bar */}
          <div className="p-4 bg-[#161b22] border-t border-gray-800 flex items-center justify-center space-x-6 z-20">
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer text-lg ${
                isMuted ? 'bg-red-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎙️'}
            </button>

            {callState.callType === 'video' && (
              <button
                onClick={toggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer text-lg ${
                  isCameraOff ? 'bg-red-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
                title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isCameraOff ? '🚫' : '📹'}
              </button>
            )}

            <button
              onClick={onEndCall}
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
