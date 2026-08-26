import React from 'react';
import { FlameIcon } from './Icons';

const SplashLoader = ({ fullScreen = true }) => {
  return (
    <div
      className={`${
        fullScreen
          ? 'fixed inset-0 z-[999999] w-screen h-screen'
          : 'w-full py-20'
      } flex flex-col items-center justify-center select-none font-sans bg-white text-gray-900 animate-in fade-in duration-200 overflow-hidden`}
    >
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        {/* Perfectly Centered Flame Logo with Smooth Heartbeat Scale Animation */}
        <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 mx-auto">
          {/* Subtle Heartbeat Glow Ring */}
          <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-red-500/10 animate-ping duration-1000 pointer-events-none"></div>

          {/* Centered Flame Icon with Heartbeat Animation */}
          <div
            className="relative z-10 text-[#c8102e] flex items-center justify-center w-full h-full"
            style={{
              animation: 'devmeetHeartbeat 1.3s infinite ease-in-out'
            }}
          >
            <FlameIcon className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xs" />
          </div>
        </div>

        {/* Clean DevMeet Brand Wordmark */}
        <div className="text-center space-y-1">
          <h1 
            className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 select-none"
            style={{ fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            dev<span className="text-[#c8102e]">meet</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-gray-400">
            it starts with a swipe
          </p>
        </div>
      </div>

      {/* Smooth Heartbeat CSS */}
      <style>{`
        @keyframes devmeetHeartbeat {
          0% {
            transform: scale(1);
          }
          14% {
            transform: scale(1.15);
          }
          28% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.08);
          }
          70% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default SplashLoader;
