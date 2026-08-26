import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@devmeet.com');
  const [password, setPassword] = useState('Admin@12345');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginAdmin } = useAdmin();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginAdmin(email.trim(), password);
      if (res.success) {
        navigate('/admin');
      } else {
        setError(res.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot connect to admin server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#fe3c72] text-white font-black text-base shadow-xs mb-3">
            D
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            DevMeet Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in with authorized staff credentials
          </p>
        </div>

        {/* Quick Demo Switcher */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 text-xs text-slate-600">
          <div className="font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>Demo Credentials</span>
            <span className="font-mono text-[11px] text-slate-500">Admin@12345</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <button
              type="button"
              onClick={() => { setEmail('admin@devmeet.com'); setPassword('Admin@12345'); }}
              className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-medium cursor-pointer text-[11px]"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => { setEmail('moderator@devmeet.com'); setPassword('Admin@12345'); }}
              className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-medium cursor-pointer text-[11px]"
            >
              Moderator
            </button>
            <button
              type="button"
              onClick={() => { setEmail('support@devmeet.com'); setPassword('Admin@12345'); }}
              className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-medium cursor-pointer text-[11px]"
            >
              Support
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4 font-medium text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-slate-900 px-3.5 py-2 rounded-xl text-xs outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-slate-900 px-3.5 py-2 rounded-xl text-xs outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          <Link to="/" className="text-slate-600 hover:text-slate-900 font-medium">
            ← Back to Public Website
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
