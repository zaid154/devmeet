import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import {
  UsersIcon,
  CheckBadgeIcon,
  ShieldAlertIcon,
  RefreshIcon
} from '../components/AdminIcons';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${BASE_URL}/admin/dashboard`, { withCredentials: true });
      if (res.data.status) {
        setData(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const metrics = data?.metrics || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live platform metrics, user engagement, and moderation queues
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            className="self-start sm:self-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">Loading statistics...</p>
          </div>
        ) : (
          <>
            {/* Top KPI Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Users */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                    <UsersIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{metrics.totalUsers || 0}</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  {metrics.activeUsers || 0} active accounts
                </div>
              </div>

              {/* Card 2: Verified Users */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Profiles</span>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <CheckBadgeIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{metrics.verifiedUsers || 0}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  ID confirmed accounts
                </div>
              </div>

              {/* Card 3: Matches */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Matches</span>
                  <div className="p-2 rounded-lg bg-red-50 text-[#fe3c72]">
                    <span className="font-black text-xs">M</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{metrics.totalMatches || 0}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {metrics.totalMessages || 0} messages exchanged
                </div>
              </div>

              {/* Card 4: Reports */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Reports</span>
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <ShieldAlertIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{metrics.pendingReports || 0}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  <Link to="/admin/reports" className="text-slate-900 hover:underline font-semibold">
                    Review reports queue →
                  </Link>
                </div>
              </div>

            </div>

            {/* Quick Action Alerts Bar */}
            {(metrics.pendingReports > 0 || metrics.pendingVerifications > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {metrics.pendingVerifications > 0 && (
                  <Link
                    to="/admin/verifications"
                    className="bg-blue-50/70 border border-blue-200 hover:bg-blue-50 rounded-2xl p-4 flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        <CheckBadgeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-blue-900">
                          {metrics.pendingVerifications} Verification Application{metrics.pendingVerifications > 1 ? 's' : ''}
                        </div>
                        <div className="text-[11px] text-blue-700">Review submitted photo identification</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-blue-700">View Queue →</span>
                  </Link>
                )}

                {metrics.pendingReports > 0 && (
                  <Link
                    to="/admin/reports"
                    className="bg-amber-50/70 border border-amber-200 hover:bg-amber-50 rounded-2xl p-4 flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                        <ShieldAlertIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-amber-900">
                          {metrics.pendingReports} Safety Violation Report{metrics.pendingReports > 1 ? 's' : ''}
                        </div>
                        <div className="text-[11px] text-amber-700">Action required on flagged accounts</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-700">Triage →</span>
                  </Link>
                )}
              </div>
            )}

            {/* Bottom 2-Column: Recent Signups & Audit Trail */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Users */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-sm text-slate-900">Recent Registrations</h3>
                  <Link to="/admin/users" className="text-xs text-slate-600 hover:text-slate-900 font-semibold">
                    View All Users →
                  </Link>
                </div>

                <div className="space-y-2">
                  {data?.recentUsers?.length > 0 ? (
                    data.recentUsers.map((u) => (
                      <div
                        key={u._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                            alt={u.firstName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-semibold text-xs text-slate-900 flex items-center space-x-1.5">
                              <span>{u.firstName} {u.lastName}</span>
                              {u.isVerified && (
                                <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-1 rounded">✓</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{u.email} • {u.location || 'Remote'}</div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase ${
                          u.accountStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {u.accountStatus}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500">No users found.</div>
                  )}
                </div>
              </div>

              {/* Recent Audit Trail */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-sm text-slate-900">Audit Activity Trail</h3>
                  <Link to="/admin/activity-logs" className="text-xs text-slate-600 hover:text-slate-900 font-semibold">
                    Full Log History →
                  </Link>
                </div>

                <div className="space-y-2">
                  {data?.recentLogs?.length > 0 ? (
                    data.recentLogs.map((log) => (
                      <div
                        key={log._id}
                        className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-semibold text-slate-700 bg-slate-200/70 px-1.5 py-0.5 rounded">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-slate-700 text-xs leading-relaxed">
                          {log.details}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.adminEmail}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500">No activity logged yet.</div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
