import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { SearchIcon } from '../components/AdminIcons';

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        search,
        action: actionFilter
      });

      const res = await axios.get(`${BASE_URL}/admin/activity-logs?${params.toString()}`, { withCredentials: true });
      if (res.data.status) {
        setLogs(res.data.data.logs || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Audit Activity Trail
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable record of administrative actions, moderation penalties, verification approvals, and configuration changes
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto font-mono">
            Total Events: <strong className="text-slate-900">{pagination.total}</strong>
          </div>
        </div>

        {/* Search & Action Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-2xs">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <SearchIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search audit trail by admin email or action details..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-800 text-slate-900 pl-9 pr-3 py-2 text-xs rounded-xl outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              Filter
            </button>
          </form>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs outline-none"
          >
            <option value="">All Action Types</option>
            <option value="ADMIN_LOGIN">Admin Login</option>
            <option value="USER_SUSPENDED">User Suspended</option>
            <option value="USER_BANNED">User Banned</option>
            <option value="USER_ACTIVE">User Restored</option>
            <option value="VERIFICATION_APPROVED">Verification Approved</option>
            <option value="VERIFICATION_REJECTED">Verification Rejected</option>
            <option value="REPORT_RESOLVED">Report Resolved</option>
            <option value="PHOTO_REMOVED">Photo Removed</option>
            <option value="BIO_RESET">Bio Reset</option>
            <option value="ANNOUNCEMENT_CREATED">Announcement Created</option>
            <option value="FEATURES_UPDATED">Features Updated</option>
          </select>
        </div>

        {/* Logs Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Admin</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">No activity logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 font-mono">
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 text-[11px]">{log.adminEmail}</div>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-100 text-purple-700 border border-purple-200">
                        {log.adminRole || 'admin'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-800 text-xs">
                      {log.details}
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-400 text-[10px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Page <strong className="text-slate-900">{pagination.page}</strong> of {pagination.totalPages}
              </div>
              <div className="flex space-x-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                  className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchLogs(pagination.page + 1)}
                  className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminActivityLogs;
