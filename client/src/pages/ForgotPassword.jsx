import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FlameIcon, CloseIcon } from '../components/Icons';
import { BASE_URL } from '../utils/constants';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/forgot-password`, { email: email.trim() });
      if (res.data.status) {
        setToken(res.data.resetToken);
        setSuccess('Password reset link generated! Click below to reset your password.');
      } else {
        setError(res.data.message || 'User not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs px-4 py-6">
      <div className="bg-[#111418] text-white w-full max-w-[400px] rounded-3xl p-7 relative shadow-2xl border border-gray-800 animate-in fade-in zoom-in-95">
        <button 
          onClick={() => navigate('/login')}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-800 transition-colors"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-3">
          <FlameIcon className="w-10 h-10 text-[#fe3c72]" />
        </div>

        <div className="text-center mb-5">
          <h2 className="text-2xl font-black text-white">Reset Password</h2>
          <p className="text-xs text-gray-400 mt-1">Enter your registered email address</p>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-300 text-xs rounded-xl p-3 mb-4 text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl p-3 mb-4 text-center font-medium space-y-2">
            <p>{success}</p>
            {token && (
              <Link 
                to={`/reset-password?token=${token}`}
                className="inline-block bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-1.5 rounded-full text-xs mt-2 transition-colors"
              >
                Go to Reset Page →
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleForgot} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-[#1c2026] border border-gray-700 focus:border-[#fe3c72] text-white px-4 py-3 rounded-xl text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#fe3c72] to-[#ff655b] hover:opacity-95 text-white font-bold py-3.5 rounded-full transition-all text-sm shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center mt-5 pt-4 border-t border-gray-800 text-xs text-gray-400">
          Remember password?{' '}
          <Link to="/login" className="text-[#fe3c72] hover:underline font-semibold">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
