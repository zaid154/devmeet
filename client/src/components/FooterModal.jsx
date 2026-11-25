import React, { useState } from 'react';

const FooterModal = ({ modalType, onClose }) => {
  const [contactCategory, setContactCategory] = useState('general');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');

  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');

  if (!modalType) return null;

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  const handlePromoSubmit = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'DEVMEET2026' || promoCode.trim().toUpperCase() === 'TINDER') {
      setPromoMessage('🎉 Success! 1-Month DevMeet Gold free trial activated on your account.');
    } else {
      setPromoMessage('✨ Promo code redeemed! Features will be applied to your profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in select-none font-sans">
      <div className="bg-white text-gray-900 rounded-[32px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[88vh] flex flex-col my-auto text-left animate-in zoom-in-95 duration-200">
        
        {/* Header with Close */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#fe3c72]"></span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">DevMeet Information</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-5 pr-1 space-y-5 text-sm">
          
          {/* ============================================================ */}
          {/* 1. LEGAL: PRIVACY POLICY */}
          {/* ============================================================ */}
          {modalType === 'privacy' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">Privacy Policy</h2>
              <p className="text-xs text-gray-500 font-medium">Last updated: January 2026</p>
              <div className="space-y-3 text-xs leading-relaxed text-gray-700">
                <p>Welcome to DevMeet. Your privacy is paramount. This Privacy Policy explains how we collect, store, and process your information when you use our website, applications, and related developer matchmaking services.</p>
                <h4 className="font-bold text-gray-900 text-sm pt-2">1. Information We Collect</h4>
                <p>We collect information you provide directly to us when creating an account: your first name, email address, date of birth, gender identity, tech stack skills, profile photos, and optional location coordinates.</p>
                <h4 className="font-bold text-gray-900 text-sm pt-2">2. How We Use Information</h4>
                <p>We use your information exclusively to connect you with nearby developers, facilitate mutual matching, enable real-time messaging, and ensure platform safety and security.</p>
                <h4 className="font-bold text-gray-900 text-sm pt-2">3. Data Sharing & Security</h4>
                <p>We never sell your personal data to third parties. All data transmission is encrypted via TLS 1.3, and credentials are cryptographically hashed using bcrypt.</p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. LEGAL: TERMS OF SERVICE */}
          {/* ============================================================ */}
          {modalType === 'terms' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">Terms of Service</h2>
              <p className="text-xs text-gray-500 font-medium">Effective Date: January 2026</p>
              <div className="space-y-3 text-xs leading-relaxed text-gray-700">
                <p>By accessing or using DevMeet, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.</p>
                <h4 className="font-bold text-gray-900 text-sm pt-2">1. Eligibility</h4>
                <p>You must be at least 18 years of age to create an account on DevMeet.</p>
                <h4 className="font-bold text-gray-900 text-sm pt-2">2. Community Standards</h4>
                <p>DevMeet is a community for developers, engineers, and tech enthusiasts. Hate speech, harassment, impersonation, unverified commercial spam, and malicious behavior result in immediate account termination.</p>
                <h4 className="font-bold text-gray-900 text-sm pt-2">3. Account Ownership</h4>
                <p>You are responsible for maintaining the confidentiality of your credentials and all activities occurring under your account.</p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. LEGAL: COOKIE POLICY */}
          {/* ============================================================ */}
          {modalType === 'cookies' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">Cookie Policy</h2>
              <div className="space-y-3 text-xs leading-relaxed text-gray-700">
                <p>We use essential cookies and similar storage technologies to authenticate your session, maintain security, remember discovery preferences, and deliver real-time notifications.</p>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Strictly Necessary Cookies</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Always Active</span>
                  </div>
                  <p className="text-[11px] text-gray-500">Required for authentication tokens (JWT) and web socket session stability.</p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 4. PLANS & SUBSCRIPTIONS (Tinder Gold Comparison) */}
          {/* ============================================================ */}
          {(modalType === 'plans' || modalType.startsWith('plan-')) && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900">DevMeet Subscription Plans</h2>
                <p className="text-xs text-gray-500 mt-1">Upgrade your developer matchmaking experience with premium capabilities.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Free Tier */}
                <div className="border border-gray-200 rounded-2xl p-4 flex flex-col justify-between hover:border-gray-400 transition-all">
                  <div>
                    <h3 className="font-black text-base text-gray-900">DevMeet Free</h3>
                    <div className="text-xl font-black text-gray-900 my-2">$0 <span className="text-xs font-normal text-gray-500">/mo</span></div>
                    <ul className="text-[11px] space-y-1.5 text-gray-600">
                      <li>✓ Unlimited basic swipes</li>
                      <li>✓ Mutual matching</li>
                      <li>✓ 1-on-1 chat & code snippet sharing</li>
                    </ul>
                  </div>
                  <button className="mt-4 w-full bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs cursor-default">
                    Current Plan
                  </button>
                </div>

                {/* Plus Tier */}
                <div className="border-2 border-[#fe3c72] rounded-2xl p-4 flex flex-col justify-between shadow-md relative bg-pink-50/20">
                  <span className="absolute -top-2.5 right-4 bg-[#fe3c72] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">Popular</span>
                  <div>
                    <h3 className="font-black text-base text-[#fe3c72]">DevMeet Plus</h3>
                    <div className="text-xl font-black text-gray-900 my-2">$9.99 <span className="text-xs font-normal text-gray-500">/mo</span></div>
                    <ul className="text-[11px] space-y-1.5 text-gray-700">
                      <li>✓ Unlimited Rewinds (↺)</li>
                      <li>✓ Global Passport Location Mode</li>
                      <li>✓ 5 Super Likes per week (⭐)</li>
                      <li>✓ Hide Age & Distance</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => alert('DevMeet Plus trial activated!')}
                    className="mt-4 w-full bg-[#fe3c72] hover:bg-[#e02e62] text-white font-bold py-2 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                  >
                    Get Plus
                  </button>
                </div>

                {/* Gold Tier */}
                <div className="border-2 border-amber-400 bg-amber-50/20 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                  <div>
                    <h3 className="font-black text-base text-amber-600">DevMeet Gold</h3>
                    <div className="text-xl font-black text-gray-900 my-2">$19.99 <span className="text-xs font-normal text-gray-500">/mo</span></div>
                    <ul className="text-[11px] space-y-1.5 text-gray-700">
                      <li>✓ See Who Liked You</li>
                      <li>✓ Top Developer Radar Picks</li>
                      <li>✓ 1 Free Monthly Profile Boost (⚡)</li>
                      <li>✓ Verified Badge Fast-Track</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => alert('DevMeet Gold activated!')}
                    className="mt-4 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold py-2 rounded-xl text-xs cursor-pointer shadow-xs transition-transform hover:scale-105"
                  >
                    Upgrade to Gold
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 5. CAREERS PORTAL */}
          {/* ============================================================ */}
          {modalType === 'careers' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">Join the DevMeet Team</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                We're building the future of developer relationships, pair programming partnerships, and technical connections worldwide.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { role: 'Senior Full Stack Engineer', stack: 'React, Node.js, WebRTC, Redis', location: 'Remote / Hybrid' },
                  { role: 'Machine Learning Recommendation Lead', stack: 'Python, PyTorch, Vector Search', location: 'Remote' },
                  { role: 'Trust & Safety Operations Lead', stack: 'Moderation, Policy, Community', location: 'San Francisco, CA' },
                  { role: 'Product Designer (UI/UX)', stack: 'Figma, Design Systems, Animation', location: 'Remote' }
                ].map((job, idx) => (
                  <div key={idx} className="bg-gray-50 hover:bg-gray-100 p-4 rounded-2xl border border-gray-200 flex items-center justify-between transition-colors">
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">{job.role}</h4>
                      <p className="text-[11px] text-gray-500">{job.stack} &bull; {job.location}</p>
                    </div>
                    <button 
                      onClick={() => alert(`Application opened for ${job.role}. Please send your GitHub profile to careers@devmeet.com`)}
                      className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-full cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 6. SUPPORT & HELP CENTER / FAQ */}
          {/* ============================================================ */}
          {modalType === 'help' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">Help Center & FAQs</h2>
              
              <div className="space-y-3">
                {[
                  { q: 'How does matching work on DevMeet?', a: 'When two developers like each other (mutual swipe right or accepted connection), it creates an instant Match. You can immediately chat and video call.' },
                  { q: 'How do I get a Verified Developer badge?', a: 'Go to Profile > Edit Profile and connect your verified GitHub or submit a verification photo proof. Our moderation team reviews submissions within 24 hours.' },
                  { q: 'Is DevMeet completely free to use?', a: 'Yes! Core matchmaking, swiping, chatting, and filtering are 100% free forever for all developers.' },
                  { q: 'How do I block or report someone?', a: 'Open the user profile card and click the Safety Shield icon (🛡️) to block or file a report with our 24/7 moderation team.' }
                ].map((faq, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-1">
                    <h4 className="font-bold text-xs text-gray-900">{faq.q}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 7. CONTACT SUPPORT FORM */}
          {/* ============================================================ */}
          {modalType === 'contact' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">Contact DevMeet Support</h2>
              <p className="text-xs text-gray-500">Need help with your account or have feedback? Our team is here 24/7.</p>

              {contactSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl text-center space-y-2">
                  <div className="text-3xl">🎉</div>
                  <h4 className="font-bold text-sm">Message Sent!</h4>
                  <p className="text-xs">Ticket #DEV-{Math.floor(100000 + Math.random() * 900000)} has been created. A support specialist will respond within 4 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Issue Category</label>
                    <select
                      value={contactCategory}
                      onChange={(e) => setContactCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="account">Account & Login Support</option>
                      <option value="billing">Billing & Subscriptions</option>
                      <option value="safety">Trust & Safety Report</option>
                      <option value="feedback">Product Feedback & Bug Report</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="developer@example.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Describe your issue or feedback in detail..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-xs cursor-pointer shadow-md transition-colors"
                  >
                    Submit Support Ticket
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 8. TRUST & SAFETY / GUIDELINES */}
          {/* ============================================================ */}
          {modalType === 'safety' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">Community Safety & Guidelines</h2>
              <div className="space-y-3 text-xs leading-relaxed text-gray-700">
                <div className="flex items-start space-x-3 bg-red-50 p-4 rounded-2xl border border-red-100">
                  <span className="text-xl">🛡️</span>
                  <div>
                    <h4 className="font-bold text-red-900">Zero Tolerance for Harassment</h4>
                    <p className="text-red-700 text-[11px] mt-0.5">We maintain strict policies against hate speech, bullying, impersonation, and non-consensual content.</p>
                  </div>
                </div>

                <h4 className="font-bold text-gray-900 text-sm pt-2">Developer Meetup Safety Tips</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Meet in public tech spaces, coffee shops, or co-working spaces for initial IRL meetups.</li>
                  <li>Keep communications on DevMeet until you establish mutual trust.</li>
                  <li>Never share credentials, private API keys, or financial information.</li>
                  <li>Use our verified badges to authenticate developer identities.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 9. PROMO CODES */}
          {/* ============================================================ */}
          {modalType === 'promo' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">Redeem Promo Code</h2>
              <p className="text-xs text-gray-500">Enter your developer event or promotional coupon code below.</p>

              {promoMessage ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold text-center">
                  {promoMessage}
                </div>
              ) : (
                <form onSubmit={handlePromoSubmit} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter Code (e.g. DEVMEET2026)"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider text-gray-900 outline-none text-center"
                  />
                  <button
                    type="submit"
                    className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3.5 rounded-xl text-xs cursor-pointer shadow-md"
                  >
                    Redeem Code
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 10. COMMUNITY & SOCIAL CHANNELS */}
          {/* ============================================================ */}
          {modalType === 'community' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">DevMeet Developer Community</h2>
              <p className="text-xs text-gray-500">Join thousands of builders across our official developer hubs.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { name: 'Discord Server', desc: '15,000+ active coders & hackathons', icon: '💬', link: 'https://discord.com' },
                  { name: 'GitHub Organization', desc: 'Open-source SDKs & repos', icon: '🐙', link: 'https://github.com' },
                  { name: 'Twitter / X', desc: 'Product updates & dev highlights', icon: '🐦', link: 'https://twitter.com' },
                  { name: 'YouTube Channel', desc: 'Pair programming & tech talks', icon: '📺', link: 'https://youtube.com' }
                ].map((comm, idx) => (
                  <a
                    key={idx}
                    href={comm.link}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-gray-50 hover:bg-gray-100 p-4 rounded-2xl border border-gray-200 flex items-center space-x-3 transition-colors group cursor-pointer"
                  >
                    <span className="text-2xl">{comm.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-gray-900 group-hover:text-[#fe3c72]">{comm.name}</h4>
                      <p className="text-[10px] text-gray-500 truncate">{comm.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 11. LANGUAGE SELECTOR */}
          {/* ============================================================ */}
          {modalType === 'language' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900">Select Language</h2>
              
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {[
                  'English (US)', 'English (UK)', 'Hindi (हिन्दी)', 'Spanish (Español)',
                  'French (Français)', 'German (Deutsch)', 'Japanese (日本語)', 'Korean (한국어)',
                  'Portuguese (Português)', 'Chinese (简体中文)'
                ].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setTimeout(onClose, 200);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      selectedLanguage === lang
                        ? 'border-[#fe3c72] bg-pink-50 text-[#fe3c72]'
                        : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 12. APP DOWNLOAD / QR CODE */}
          {/* ============================================================ */}
          {modalType === 'download' && (
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-black text-gray-900">Download DevMeet App</h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">Scan the QR code with your phone camera to download DevMeet on iOS & Android.</p>
              
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-3xl p-4 flex items-center justify-center border-2 border-gray-200 shadow-inner">
                <div className="w-full h-full border-4 border-dashed border-gray-400 rounded-2xl flex flex-col items-center justify-center text-gray-500">
                  <span className="text-4xl mb-1">📱</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Scan for DevMeet</span>
                </div>
              </div>

              <div className="flex justify-center space-x-3 pt-2">
                <button className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center space-x-2">
                  <span></span>
                  <span>App Store</span>
                </button>
                <button className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center space-x-2">
                  <span>▶</span>
                  <span>Google Play</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-black hover:bg-gray-800 text-white font-bold px-6 py-2.5 rounded-full text-xs cursor-pointer shadow-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default FooterModal;
