import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SplashLoader from './SplashLoader';
import { FlameIcon, HeartIcon } from './Icons';

const Home = () => {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 650);

    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return <SplashLoader text="Welcome to DevMeet..." fullScreen={true} />;
  }

  return (
    <div className="w-full max-w-full bg-white text-gray-900 font-sans selection:bg-[#fe3c72] selection:text-white overflow-x-hidden animate-in fade-in duration-500">
      
      {/* 1. HERO SECTION (Fluid Responsive Scale) */}
      <section className="relative pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-rose-50/30 via-white to-white overflow-hidden">
        
        {/* Subtle Background Glows */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-tr from-pink-500/10 via-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-5 sm:space-y-7">
          
          {/* Top Trending Badge */}
          <div className="inline-flex items-center space-x-2 bg-pink-50 border border-pink-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#c8102e] shadow-2xs">
            <span className="animate-pulse">🔥</span>
            <span>#1 Matchmaking for Developers & Tech Founders</span>
          </div>

          {/* Main Headline (Fluid Proportional Scaling) */}
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-[#c8102e] tracking-tight leading-[1.05] sm:leading-[1.02] select-none max-w-4xl px-2"
            style={{ fontFamily: '"Georgia", "Times New Roman", Times, serif' }}
          >
            It starts with a swipe.<span className="text-lg sm:text-2xl font-sans font-black text-[#c8102e] align-top ml-1">TM</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-xs sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed px-2">
            Where developers, designers, and innovators match, chat, pair-program, and build something meaningful together.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-md pt-1">
            <Link
              to="/signup"
              className="w-full sm:w-auto flex-1 bg-[#c8102e] hover:bg-[#a50d25] text-white font-bold text-xs sm:text-sm md:text-base px-7 py-3 rounded-full shadow-lg shadow-red-500/20 hover:shadow-red-500/35 transition-all text-center cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              <FlameIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>Create account</span>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto flex-1 bg-[#ebedf0] hover:bg-[#dfe3e6] text-gray-900 font-bold text-xs sm:text-sm md:text-base px-7 py-3 rounded-full transition-all text-center cursor-pointer hover:scale-105 active:scale-95"
            >
              Get the app
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="flex items-center justify-center space-x-3 pt-1 text-xs text-gray-500 font-semibold">
            <div className="flex -space-x-2 overflow-hidden">
              <img className="inline-block h-6 w-6 sm:h-7 sm:w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="User 1" />
              <img className="inline-block h-6 w-6 sm:h-7 sm:w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="User 2" />
              <img className="inline-block h-6 w-6 sm:h-7 sm:w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" alt="User 3" />
              <img className="inline-block h-6 w-6 sm:h-7 sm:w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&q=80" alt="User 4" />
            </div>
            <span className="text-[11px] sm:text-xs">⭐⭐⭐⭐⭐ Over <strong>50,000+</strong> matches made</span>
          </div>

          {/* 📱 HERO INTERACTIVE TINDER MATCH CARD PREVIEW */}
          <div className="pt-4 sm:pt-6 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
            <div className="bg-white rounded-[28px] sm:rounded-[32px] p-3 sm:p-4 shadow-2xl border border-gray-100/90 relative transform hover:-translate-y-1 transition-all duration-300">
              
              {/* Card Photo Preview */}
              <div className="w-full h-72 sm:h-80 md:h-92 rounded-[20px] sm:rounded-[24px] overflow-hidden relative shadow-inner">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                  alt="Developer Profile"
                  className="w-full h-full object-cover"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-5 text-left text-white">
                  
                  {/* Verification Badge & Name */}
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl sm:text-2xl font-black">Priya Sharma, 24</h3>
                    <span className="bg-blue-500 text-white rounded-full p-0.5 text-[9px] sm:text-[10px]" title="Verified Developer">✓</span>
                  </div>

                  <p className="text-[11px] sm:text-xs text-emerald-400 font-mono font-bold mt-0.5 flex items-center">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                    Full-Stack Engineer &bull; Bangalore 📍
                  </p>

                  {/* Framework Tags */}
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2.5">
                    <span className="text-[9px] sm:text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-white">⚛️ React</span>
                    <span className="text-[9px] sm:text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-white">🐍 Python</span>
                    <span className="text-[9px] sm:text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-white">🎧 Lo-Fi Code</span>
                  </div>
                </div>
              </div>

              {/* Floating Action Buttons Bar (Tinder Style) */}
              <div className="flex items-center justify-center space-x-3 sm:space-x-4 py-2 pt-3">
                <button className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border border-gray-200 text-red-500 shadow-md flex items-center justify-center text-base sm:text-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer">
                  ✕
                </button>
                <button className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 text-blue-500 shadow-md flex items-center justify-center text-xs sm:text-sm hover:scale-110 active:scale-95 transition-transform cursor-pointer">
                  ⭐
                </button>
                <button className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-r from-[#fe3c72] to-[#ff5864] text-white shadow-xl shadow-pink-500/30 flex items-center justify-center text-xl sm:text-2xl hover:scale-110 active:scale-95 transition-transform cursor-pointer">
                  ❤️
                </button>
                <button className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 text-purple-500 shadow-md flex items-center justify-center text-xs sm:text-sm hover:scale-110 active:scale-95 transition-transform cursor-pointer">
                  ⚡
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>


      {/* 2. THREE FEATURE CARDS (Optimized Viewport Fit) */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-10 sm:pt-4 sm:pb-14">
        <div className="space-y-1 mb-4 sm:mb-5 text-left">
          <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-widest text-[#c8102e]">Core Highlights</span>
          <h2 
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight"
            style={{ fontFamily: '"Georgia", "Times New Roman", Times, serif' }}
          >
            A lot has changed since your last swipe.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          
          {/* Card 1: Pair Programming */}
          <div className="bg-[#0f172a] text-white rounded-[24px] p-4 sm:p-5 lg:p-6 flex flex-col justify-between min-h-[340px] sm:min-h-[370px] lg:h-[390px] shadow-xl group hover:scale-[1.01] transition-transform overflow-hidden relative border border-slate-800">
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase font-extrabold tracking-widest text-emerald-400 block mb-0.5">Pair Programming</span>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-black leading-tight mb-1">Code together &gt; code alone</h3>
            </div>
            
            <div className="my-auto flex justify-center py-2 w-full">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/60 group-hover:border-emerald-400/50 transition-colors">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
                  alt="Pair Programming"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium mb-1.5 line-clamp-2">First dates hit different when you're debugging together.</p>
              <Link to="/login" className="inline-flex items-center text-xs font-bold text-emerald-400 group-hover:underline cursor-pointer">
                Start Pair Coding &rarr;
              </Link>
            </div>
          </div>

          {/* Card 2: Tech Stack Match */}
          <div className="bg-[#121b2d] text-white rounded-[24px] p-4 sm:p-5 lg:p-6 flex flex-col justify-between min-h-[340px] sm:min-h-[370px] lg:h-[390px] shadow-xl group hover:scale-[1.01] transition-transform overflow-hidden relative border border-slate-800">
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase font-extrabold tracking-widest text-blue-300 block mb-0.5">Tech Stack Match</span>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-black leading-tight mb-1">Stack compatibility</h3>
            </div>
            
            <div className="my-auto flex justify-center py-2 w-full">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-800/60 group-hover:border-blue-400/50 transition-colors">
                <img
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80"
                  alt="Tech Stack Match"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] sm:text-xs text-blue-100 font-medium mb-1.5 line-clamp-2">Find developers who share your frameworks and passions.</p>
              <Link to="/login" className="inline-flex items-center text-xs font-bold text-blue-300 group-hover:underline cursor-pointer">
                Filter by Stacks &rarr;
              </Link>
            </div>
          </div>

          {/* Card 3: Music Mode */}
          <div className="bg-[#fcf0f5] text-gray-900 border border-pink-200/70 rounded-[24px] p-4 sm:p-5 lg:p-6 flex flex-col justify-between min-h-[340px] sm:min-h-[370px] lg:h-[390px] shadow-xl group hover:scale-[1.01] transition-transform overflow-hidden relative md:col-span-2 lg:col-span-1">
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase font-extrabold tracking-widest text-pink-700 block mb-0.5">Music Mode</span>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-black leading-tight mb-1 text-gray-900">Good taste</h3>
            </div>
            
            <div className="my-auto flex justify-center py-2 w-full">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-pink-200/80 group-hover:border-pink-400/80 transition-colors">
                <img
                  src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80"
                  alt="Music Mode"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] sm:text-xs text-gray-600 font-medium mb-1.5 line-clamp-2">Your fav playlist says more than your bio ever could.</p>
              <Link to="/login" className="inline-flex items-center text-xs font-bold text-pink-700 group-hover:underline cursor-pointer">
                Discover Music Matches &rarr;
              </Link>
            </div>
          </div>

        </div>
      </section>


      {/* 3. INSPIRATIONAL QUOTE SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center space-y-4 sm:space-y-6">
        <h3 
          className="text-2xl sm:text-4xl md:text-5xl font-black text-[#c8102e] leading-tight px-2"
          style={{ fontFamily: '"Georgia", "Times New Roman", Times, serif' }}
        >
          'The best things that ever happened to you started with "let's just see."'
        </h3>
        <p className="text-sm sm:text-lg md:text-xl text-gray-900 font-black max-w-2xl mx-auto leading-snug px-2">
          More to connect on. More to explore. More possibilities than you could ever expect.
        </p>
        <p className="text-[11px] sm:text-xs font-black text-gray-400 tracking-widest uppercase">&mdash; Welcome to DevMeet</p>
      </section>


      {/* 4. PAIR PROGRAMMING SECTION */}
      <section className="bg-[#0f172a] text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          
          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-sm sm:text-lg font-serif text-slate-300 font-bold">You + a developer &bull; Them + a developer</p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight pt-1 px-2" style={{ fontFamily: '"Georgia", "Times New Roman", Times, serif' }}>
              First dates hit different over code
            </h2>
            <p className="text-[11px] sm:text-xs uppercase font-extrabold tracking-widest text-emerald-400">Meet Pair Programming Mode.</p>
          </div>

          <div className="space-y-2 max-w-xl mx-auto px-2">
            <h3 className="text-xl sm:text-2xl font-black">Party of four</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              First dates don't have to feel like tech interviews. Pair Programming changes the dynamic: you bring your person, they bring theirs, and suddenly it's developers seeing what happens. Less pressure. More fun.
            </p>
          </div>

          {/* 4 Overlapping Polaroid Photos (Fluid Adaptive Sizing) */}
          <div className="pt-4 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-3xl mx-auto px-2">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" 
              alt="Developer 1" 
              className="w-full sm:w-36 sm:h-48 md:w-44 md:h-56 aspect-[3/4] object-cover rounded-2xl shadow-xl sm:transform sm:-rotate-6 sm:hover:rotate-0 transition-transform border-2 sm:border-4 border-slate-800"
            />
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80" 
              alt="Developer 2" 
              className="w-full sm:w-36 sm:h-48 md:w-44 md:h-56 aspect-[3/4] object-cover rounded-2xl shadow-xl sm:transform sm:rotate-4 sm:hover:rotate-0 transition-transform border-2 sm:border-4 border-slate-800"
            />
            <img 
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80" 
              alt="Developer 3" 
              className="w-full sm:w-36 sm:h-48 md:w-44 md:h-56 aspect-[3/4] object-cover rounded-2xl shadow-xl sm:transform sm:-rotate-3 sm:hover:rotate-0 transition-transform border-2 sm:border-4 border-slate-800"
            />
            <img 
              src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80" 
              alt="Developer 4" 
              className="w-full sm:w-36 sm:h-48 md:w-44 md:h-56 aspect-[3/4] object-cover rounded-2xl shadow-xl sm:transform sm:rotate-6 sm:hover:rotate-0 transition-transform border-2 sm:border-4 border-slate-800"
            />
          </div>

        </div>
      </section>


      {/* 5. TECH STACK COMPATIBILITY SECTION */}
      <section className="bg-[#0b0f19] text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10">
          
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-pink-300 px-2" style={{ fontFamily: '"Georgia", "Times New Roman", Times, serif' }}>
              A matching tech stack goes a long way
            </h2>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-400 font-bold block">Tech Stack Match</span>
          </div>

          <div className="space-y-2 max-w-lg mx-auto px-2">
            <h3 className="text-xl sm:text-2xl font-black">Stack compatibility</h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Your tech stack is already part of the conversation. Filter by language or let stack compatibility come up naturally.
            </p>
          </div>

          {/* Tech Stack Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto pt-3 text-left">
            
            <div className="bg-gray-900/90 border border-gray-800 p-4 sm:p-5 rounded-3xl space-y-3">
              <h4 className="font-bold text-xs sm:text-sm text-white">Your Stack Mix</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center space-x-2.5 bg-black/50 p-2.5 rounded-2xl">
                  <span className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-mono text-[11px] font-bold shrink-0">JS</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-yellow-400 truncate">JavaScript (50%)</p>
                    <span className="text-[9px] text-gray-400 block truncate">Full Stack</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2.5 bg-black/50 p-2.5 rounded-2xl">
                  <span className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-mono text-[11px] font-bold shrink-0">TS</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-blue-400 truncate">TypeScript (25%)</p>
                    <span className="text-[9px] text-gray-400 block truncate">Type Safety</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2.5 bg-black/50 p-2.5 rounded-2xl">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-[11px] font-bold shrink-0">Py</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-emerald-400 truncate">Python (15%)</p>
                    <span className="text-[9px] text-gray-400 block truncate">ML & Data</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2.5 bg-black/50 p-2.5 rounded-2xl">
                  <span className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-[11px] font-bold shrink-0">Go</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-cyan-400 truncate">Go (10%)</p>
                    <span className="text-[9px] text-gray-400 block truncate">Systems</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/90 border border-gray-800 p-4 sm:p-5 rounded-3xl space-y-2.5 flex flex-col justify-between">
              <div>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-pink-400">DevMeet Match</span>
                <h4 className="font-bold text-sm sm:text-base text-white mt-0.5">You and Priya</h4>
                <p className="text-[11px] text-gray-400">You: React + Node &bull; Priya: React + Python</p>
              </div>
              <p className="text-xs text-gray-300 italic bg-black/40 p-2.5 rounded-xl border border-gray-800">
                "You both share a passion for building scalable web applications and clean architecture."
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* 6. MUSIC MODE SECTION */}
      <section className="bg-white text-gray-900 py-12 sm:py-16 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
          
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#c8102e] px-2" style={{ fontFamily: '"Georgia", "Times New Roman", Times, serif' }}>
              A song says more than "hey" ever could
            </h2>
            <span className="text-xs uppercase font-extrabold tracking-widest text-pink-600 block">Music Mode</span>
          </div>

          <div className="space-y-2 max-w-lg mx-auto px-2">
            <h3 className="text-xl sm:text-2xl font-black">No skips</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
              Put what you're listening to on your profile. Music Mode surfaces people who share your taste. Forget "hey," your playlist just became your best opener.
            </p>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-2">
            <div className="bg-gray-100 p-3.5 sm:p-4 rounded-2xl shadow-xs max-w-xs text-left text-xs font-bold text-gray-800">
              "We bonded over our shared love of lo-fi beats while pair programming..."
            </div>
            <div className="bg-pink-50 border border-pink-200 p-3.5 sm:p-4 rounded-2xl shadow-xs max-w-xs text-left text-xs font-bold text-pink-900">
              "Let's build something together to this playlist :)"
            </div>
          </div>

        </div>
      </section>


      {/* 7. SAFETY SECTION (#safety - Viewport Optimized) */}
      <section id="safety" className="bg-[#f8f9fa] pt-2 pb-8 sm:pt-4 sm:pb-12 px-4 sm:px-6 border-t border-gray-200">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          
          <div className="text-center space-y-1 px-2">
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#c8102e]">Safety at DevMeet</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900" style={{ fontFamily: '"Georgia", "Times New Roman", Times, serif' }}>
              Your safety comes first.<br />Match, chat, and meet with confidence.
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 max-w-xl mx-auto pt-0.5">
              Photo Verification, block, unmatch, and moderation &mdash; built to help you stay in control at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Verification</span>
                <h3 className="text-base sm:text-lg font-black text-gray-900 mb-1">Connect confidently</h3>
                <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                  Verification features like Photo Verification help you feel confident there's a real person behind the profile.
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                ✓
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Respect</span>
                <h3 className="text-base sm:text-lg font-black text-gray-900 mb-1">Chat respectfully</h3>
                <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                  Our Community Guidelines set expectations for behavior so everyone can feel respected and safe.
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-[#c8102e] font-bold text-xs">
                🛡️
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Control</span>
                <h3 className="text-base sm:text-lg font-black text-gray-900 mb-1">You set the terms</h3>
                <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                  Easily block, unmatch, or report anyone who violates community standards with 1-tap controls.
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs">
                ⚙️
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* 8. PLANS & SUBSCRIPTIONS SECTION (#subscriptions - Viewport Optimized) */}
      <section id="subscriptions" className="bg-white pt-2 pb-8 sm:pt-4 sm:pb-12 px-4 sm:px-6 lg:px-12 border-t border-gray-100">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 text-center">
          
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-widest text-[#c8102e]">Choose Your Level</span>
            <h2 
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900"
              style={{ fontFamily: '"Georgia", "Times New Roman", Times, serif' }}
            >
              Subscription Plans
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 max-w-xl mx-auto">
              Upgrade your DevMeet experience to unlock unlimited swipes, instant matchmaking, and code collaboration tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 text-left">
            
            {/* Plan 1: Free */}
            <div className="bg-gray-50 p-4 sm:p-5 rounded-[22px] border border-gray-200 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Free Starter</span>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-0.5">DevMeet Free</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-black text-gray-900">₹0</span>
                  <span className="text-[11px] text-gray-500 ml-1">/ month</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-[11px] sm:text-xs text-gray-600 font-medium">
                  <li className="flex items-center">✓ 50 Daily Swipes</li>
                  <li className="flex items-center">✓ Unlimited Chat with Matches</li>
                  <li className="flex items-center">✓ Standard Profile Verification</li>
                  <li className="flex items-center text-gray-400">✕ See Who Liked You</li>
                  <li className="flex items-center text-gray-400">✕ Global Passport Mode</li>
                </ul>
              </div>
              <Link
                to="/signup"
                className="w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold text-xs py-2 rounded-full transition-all"
              >
                Get Started Free
              </Link>
            </div>

            {/* Plan 2: DevMeet Gold (Popular) */}
            <div className="bg-[#111418] text-white p-4 sm:p-5 rounded-[22px] border-2 border-[#fe3c72] shadow-xl flex flex-col justify-between space-y-4 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#fe3c72] to-[#ff5864] text-white text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow-md">
                Most Popular
              </span>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Supercharged</span>
                <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">DevMeet Gold</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-black text-white">₹499</span>
                  <span className="text-[11px] text-gray-400 ml-1">/ month</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-[11px] sm:text-xs text-slate-300 font-medium">
                  <li className="flex items-center text-emerald-400">✓ Unlimited Swipes</li>
                  <li className="flex items-center text-emerald-400">✓ See Who Liked You Instantly</li>
                  <li className="flex items-center text-emerald-400">✓ 5 Free SuperLikes / Week</li>
                  <li className="flex items-center text-emerald-400">✓ 1 Free Monthly Profile Boost</li>
                  <li className="flex items-center text-emerald-400">✓ Audio/Video Calls in Chat</li>
                </ul>
              </div>
              <Link
                to="/signup"
                className="w-full text-center bg-gradient-to-r from-[#fe3c72] to-[#ff5864] hover:opacity-90 text-white font-bold text-xs py-2 rounded-full shadow-lg shadow-pink-500/25 transition-all"
              >
                Upgrade to Gold
              </Link>
            </div>

            {/* Plan 3: DevMeet Platinum */}
            <div className="bg-gray-50 p-4 sm:p-5 rounded-[22px] border border-gray-200 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Ultimate</span>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-0.5">DevMeet Platinum</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-black text-gray-900">₹999</span>
                  <span className="text-[11px] text-gray-500 ml-1">/ month</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-[11px] sm:text-xs text-gray-600 font-medium">
                  <li className="flex items-center text-purple-600">✓ Everything in Gold</li>
                  <li className="flex items-center text-purple-600">✓ Message Before Matching</li>
                  <li className="flex items-center text-purple-600">✓ Priority Likes in Swipes</li>
                  <li className="flex items-center text-purple-600">✓ Global Tech Stack Filter</li>
                  <li className="flex items-center text-purple-600">✓ VIP 24/7 Priority Support</li>
                </ul>
              </div>
              <Link
                to="/signup"
                className="w-full text-center bg-gray-900 hover:bg-black text-white font-bold text-xs py-2 rounded-full transition-all"
              >
                Get Platinum
              </Link>
            </div>

          </div>

        </div>
      </section>


      {/* 9. SUPPORT & FAQ SECTION (#support) */}
      <section id="support" className="bg-[#f8f9fa] pt-6 pb-12 sm:pt-8 sm:pb-16 px-4 sm:px-6 lg:px-12 border-t border-gray-200">
        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
          
          <div className="text-center space-y-1.5">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#c8102e]">Help & FAQs</span>
            <h2 
              className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900"
              style={{ fontFamily: '"Georgia", "Times New Roman", Times, serif' }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
              Got questions? We've got answers. Here are the most common things developers ask about DevMeet.
            </p>
          </div>

          <div className="space-y-3">
            
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-200/80 space-y-1.5">
              <h4 className="font-bold text-xs sm:text-sm md:text-base text-gray-900">How does developer matching work on DevMeet?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                DevMeet uses your selected tech stack, programming interests, location, and personality prompts to recommend compatible developers. Swipe right to like, and when you both swipe right, it's an instant match!
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-200/80 space-y-1.5">
              <h4 className="font-bold text-xs sm:text-sm md:text-base text-gray-900">Is photo verification mandatory and free?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Yes! Photo verification is 100% free. Verified profiles receive a verified blue badge, helping ensure real, authentic developers in the community.
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-200/80 space-y-1.5">
              <h4 className="font-bold text-xs sm:text-sm md:text-base text-gray-900">Can we make voice and video calls in chat?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Yes! Once you match with another developer, you can exchange instant messages, voice notes, code snippets, and start high-definition audio/video calls directly in the app.
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-200/80 space-y-1.5">
              <h4 className="font-bold text-xs sm:text-sm md:text-base text-gray-900">Need more assistance or have custom feedback?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Our support team is available 24/7. Reach out via email at <a href="mailto:support@devmeet.com" className="text-[#c8102e] font-bold underline">support@devmeet.com</a> or join our active Discord community.
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
