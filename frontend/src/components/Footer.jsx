import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import FooterModal from './FooterModal';
import { FlameIcon } from './Icons';

const Footer = () => {
  const location = useLocation();
  const [activeModal, setActiveModal] = useState(null);

  if (
    location.pathname === '/signup' ||
    location.pathname === '/app/onboarding' ||
    location.pathname === '/feed' ||
    location.pathname === '/app/recs' ||
    location.pathname === '/app/explore' ||
    location.pathname === '/explore' ||
    location.pathname === '/search'
  ) {
    return null;
  }

  return (
    <footer className="w-full bg-[#0b0f19] text-slate-300 pt-16 pb-0 overflow-hidden font-sans border-t border-slate-800 relative select-none mt-auto">
      
      {/* Interactive Footer Modal */}
      {activeModal && (
        <FooterModal modalType={activeModal} onClose={() => setActiveModal(null)} />
      )}

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Top Brand Identity Row (Clear & Bold) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-10 mb-12 border-b border-slate-800/80 gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="text-[#c8102e]">
              <FlameIcon className="w-9 h-9 text-[#c8102e]" />
            </div>
            <span 
              className="text-3xl sm:text-4xl font-black tracking-tight text-white"
              style={{ fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            >
              dev<span className="text-[#c8102e]">meet</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Where developers match, collaborate, and build something together.
          </p>
        </div>

        {/* Top 6-Column Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 pb-16 text-left text-xs">
          
          {/* Column 1: Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">Legal</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><button onClick={() => setActiveModal('privacy')} className="hover:text-white transition-colors cursor-pointer text-left">Privacy Policy</button></li>
              <li><button onClick={() => setActiveModal('privacy')} className="hover:text-white transition-colors cursor-pointer text-left">Consumer Health Data</button></li>
              <li><button onClick={() => setActiveModal('terms')} className="hover:text-white transition-colors cursor-pointer text-left">Terms of Service</button></li>
              <li><button onClick={() => setActiveModal('cookies')} className="hover:text-white transition-colors cursor-pointer text-left">Cookie Policy</button></li>
              <li><button onClick={() => setActiveModal('terms')} className="hover:text-white transition-colors cursor-pointer text-left">Intellectual Property</button></li>
              <li><button onClick={() => setActiveModal('privacy')} className="hover:text-white transition-colors cursor-pointer text-left">Accessibility</button></li>
            </ul>
          </div>

          {/* Column 2: Careers */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">Careers</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><button onClick={() => setActiveModal('careers')} className="hover:text-white transition-colors cursor-pointer text-left">Careers Portal</button></li>
              <li><button onClick={() => setActiveModal('careers')} className="hover:text-white transition-colors cursor-pointer text-left">Engineering Blog</button></li>
              <li><button onClick={() => setActiveModal('community')} className="hover:text-white transition-colors cursor-pointer text-left">Open Source</button></li>
            </ul>
          </div>

          {/* Column 3: Community */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">Community</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><button onClick={() => setActiveModal('community')} className="hover:text-white transition-colors cursor-pointer text-left">Discord Community</button></li>
              <li><button onClick={() => setActiveModal('community')} className="hover:text-white transition-colors cursor-pointer text-left">GitHub Showcase</button></li>
              <li><button onClick={() => setActiveModal('community')} className="hover:text-white transition-colors cursor-pointer text-left">Twitter / X</button></li>
              <li><button onClick={() => setActiveModal('community')} className="hover:text-white transition-colors cursor-pointer text-left">YouTube Channel</button></li>
              <li><button onClick={() => setActiveModal('community')} className="hover:text-white transition-colors cursor-pointer text-left">LinkedIn</button></li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">Support</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><button onClick={() => setActiveModal('help')} className="hover:text-white transition-colors cursor-pointer text-left">Help Center</button></li>
              <li><button onClick={() => setActiveModal('help')} className="hover:text-white transition-colors cursor-pointer text-left">Press Room</button></li>
              <li><button onClick={() => setActiveModal('contact')} className="hover:text-white transition-colors cursor-pointer text-left">Contact Support</button></li>
              <li><button onClick={() => setActiveModal('promo')} className="hover:text-white transition-colors cursor-pointer text-left">Promo Codes</button></li>
            </ul>
          </div>

          {/* Column 5: Safety */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">Trust & Safety</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><button onClick={() => setActiveModal('safety')} className="hover:text-white transition-colors cursor-pointer text-left">Community Guidelines</button></li>
              <li><button onClick={() => setActiveModal('safety')} className="hover:text-white transition-colors cursor-pointer text-left">Safety Tips</button></li>
              <li><button onClick={() => setActiveModal('safety')} className="hover:text-white transition-colors cursor-pointer text-left">Profile Verification</button></li>
              <li><button onClick={() => setActiveModal('safety')} className="hover:text-white transition-colors cursor-pointer text-left">Security Practices</button></li>
            </ul>
          </div>

          {/* Column 6: Subscriptions */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">Plans</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><button onClick={() => setActiveModal('plans')} className="hover:text-white transition-colors cursor-pointer text-left">DevMeet Free</button></li>
              <li><button onClick={() => setActiveModal('plans')} className="hover:text-white transition-colors cursor-pointer text-left">DevMeet Plus</button></li>
              <li><button onClick={() => setActiveModal('plans')} className="hover:text-white transition-colors cursor-pointer text-left">DevMeet Gold</button></li>
              <li><button onClick={() => setActiveModal('plans')} className="hover:text-white transition-colors cursor-pointer text-left">DevMeet Platinum</button></li>
            </ul>
          </div>

        </div>

        {/* App Store Buttons & Middle Legal Text */}
        <div className="border-t border-slate-800 pt-10 pb-8 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div className="space-y-2 max-w-xl">
            <h4 className="text-sm font-bold tracking-tight text-white">GET THE APP</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Single developers, coders, and tech innovators: Discover meaningful connections, find collaborative partners, and meet someone who speaks your language on DevMeet.
            </p>
          </div>

          {/* iOS & Android Badges */}
          <div className="flex items-center space-x-3 shrink-0">
            <button 
              onClick={() => setActiveModal('download')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center space-x-2 border border-slate-700 shadow-md cursor-pointer transition-all hover:scale-105"
            >
              <span className="text-xl"></span>
              <div className="text-left">
                <span className="block text-[8px] uppercase tracking-wider text-slate-400">Download on the</span>
                <span className="block text-xs font-bold leading-none">App Store</span>
              </div>
            </button>
            <button 
              onClick={() => setActiveModal('download')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center space-x-2 border border-slate-700 shadow-md cursor-pointer transition-all hover:scale-105"
            >
              <span className="text-lg">▶</span>
              <div className="text-left">
                <span className="block text-[8px] uppercase tracking-wider text-slate-400">GET IT ON</span>
                <span className="block text-xs font-bold leading-none">Google Play</span>
              </div>
            </button>
          </div>
        </div>

        {/* Copyright & Language */}
        <div className="border-t border-slate-800/80 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>&copy; {new Date().getFullYear()} DevMeet Inc. All Rights Reserved.</span>
            <button onClick={() => setActiveModal('privacy')} className="hover:underline hover:text-white cursor-pointer">Privacy Settings</button>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <button onClick={() => setActiveModal('language')} className="hover:text-white cursor-pointer flex items-center space-x-1 font-bold">
              <span>文A</span>
              <span>English (US)</span>
            </button>
          </div>
        </div>

      </div>

      {/* GIANT PROMINENT DEVMEET SIGNATURE WORDMARK AT VERY BOTTOM */}
      <div className="w-full flex justify-center items-end overflow-hidden pointer-events-none select-none -mb-2 sm:-mb-6 lg:-mb-8 pt-4">
        <h1 
          className="text-[17vw] sm:text-[18vw] lg:text-[19vw] font-black tracking-tight leading-[0.75] transform translate-y-3 sm:translate-y-6 text-slate-800 hover:text-slate-700 transition-colors drop-shadow-sm select-none"
          style={{ fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          dev<span className="text-[#c8102e]/25">meet</span>
        </h1>
      </div>

    </footer>
  );
};

export default Footer;
