import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FlameIcon, CloseIcon } from '../components/Icons';
import { BASE_URL } from '../utils/constants';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/reset-password`, {
        token: token.trim(),
        newPassword
      });

      if (res.data.status) {
        setSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.data.message || 'Invalid or expired reset token');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
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
          <h2 className="text-2xl font-black text-white">Create New Password</h2>
          <p className="text-xs text-gray-400 mt-1">Set a strong, secure password for your account</p>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-300 text-xs rounded-xl p-3 mb-4 text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl p-3 mb-4 text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Reset Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your reset token"
              className="w-full bg-[#1c2026] border border-gray-700 focus:border-[#fe3c72] text-white px-4 py-3 rounded-xl text-sm outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 chars"
              className="w-full bg-[#1c2026] border border-gray-700 focus:border-[#fe3c72] text-white px-4 py-3 rounded-xl text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full bg-[#1c2026] border border-gray-700 focus:border-[#fe3c72] text-white px-4 py-3 rounded-xl text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#fe3c72] to-[#ff655b] hover:opacity-95 text-white font-bold py-3.5 rounded-full transition-all text-sm shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center mt-5 pt-4 border-t border-gray-800 text-xs text-gray-400">
          <Link to="/login" className="text-[#fe3c72] hover:underline font-semibold">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
