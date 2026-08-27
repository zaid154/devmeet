import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FlameIcon, CloseIcon } from '../components/Icons';
import SplashLoader from '../components/SplashLoader';
import { BASE_URL } from '../utils/constants';

const Login = ({ initialMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isSignup, setIsSignup] = useState(
    initialMode === 'signup' || location.pathname === '/signup'
  );

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('24');
  const [gender, setGender] = useState('male');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Direct Email & Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/login`,
        { email: email.trim(), password },
        { withCredentials: true }
      );

      if (res.data.status) {
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        login(res.data.data);
        navigate('/feed');
      } else {
        setError(res.data.message || 'Invalid Credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Direct Signup / Registration
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/user`,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          age: Number(age) || 24,
          gender,
          job: 'Software Engineer',
          location: 'India'
        },
        { withCredentials: true }
      );

      if (res.data.status) {
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        login(res.data.data);
        navigate('/app/onboarding', {
          state: { prefillEmail: email.trim() }
        });
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // Fill Demo Admin Credentials
  const fillDemoAdmin = () => {
    setIsSignup(false);
    setEmail('admin@devmeet.com');
    setPassword('Admin@123');
    setError('');
  };

  if (loading) {
    return <SplashLoader text="Authenticating with DevMeet..." fullScreen={true} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6 font-sans select-none overflow-y-auto">
      {/* Modal Card */}
      <div className="bg-white text-gray-900 w-full max-w-[430px] rounded-[32px] p-8 sm:p-9 relative shadow-2xl border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="w-8" />
          {/* Flame Icon */}
          <div className="flex justify-center">
            <FlameIcon className="w-10 h-10 text-[#fe3c72]" />
          </div>
          {/* Close Button */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {isSignup ? 'Create account' : 'Welcome back'}
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            {isSignup
              ? 'Join developer meetups, connect & code together.'
              : 'Log in with your email & password to continue.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-full bg-gray-100 p-1 mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setIsSignup(false); setError(''); }}
            className={`flex-1 py-2 rounded-full transition-all cursor-pointer ${
              !isSignup
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignup(true); setError(''); }}
            className={`flex-1 py-2 rounded-full transition-all cursor-pointer ${
              isSignup
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl p-3 mb-4 text-center font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-3.5 text-left text-xs">
          {isSignup && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Zaid"
                  className="w-full bg-[#f0f2f5] focus:bg-white border-2 border-transparent focus:border-[#1877F2] text-gray-900 px-3.5 py-2.5 rounded-xl text-xs font-semibold outline-none transition-all"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Khan"
                  className="w-full bg-[#f0f2f5] focus:bg-white border-2 border-transparent focus:border-[#1877F2] text-gray-900 px-3.5 py-2.5 rounded-xl text-xs font-semibold outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@devmeet.com"
              className="w-full bg-[#f0f2f5] focus:bg-white border-2 border-transparent focus:border-[#1877F2] text-gray-900 px-3.5 py-2.5 rounded-xl text-xs font-semibold outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#f0f2f5] focus:bg-white border-2 border-transparent focus:border-[#1877F2] text-gray-900 px-3.5 py-2.5 rounded-xl text-xs font-semibold outline-none transition-all"
            />
          </div>

          {isSignup && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  min="18"
                  max="80"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-[#f0f2f5] focus:bg-white border-2 border-transparent focus:border-[#1877F2] text-gray-900 px-3.5 py-2.5 rounded-xl text-xs font-semibold outline-none transition-all"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#f0f2f5] focus:bg-white border-2 border-transparent focus:border-[#1877F2] text-gray-900 px-3 py-2.5 rounded-xl text-xs font-semibold outline-none transition-all"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#c8102e] to-[#fe3c72] hover:opacity-95 text-white font-bold py-3.5 rounded-full transition-all text-xs shadow-md cursor-pointer uppercase tracking-wider mt-4"
          >
            {isSignup ? 'Create Account →' : 'Log In →'}
          </button>
        </form>

        {/* Demo Quick Login */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-400">Want to test?</span>
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="font-bold text-[#fe3c72] hover:underline cursor-pointer"
          >
            Fill Demo Admin (admin@devmeet.com)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
