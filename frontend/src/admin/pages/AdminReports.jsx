import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Action modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionType, setActionType] = useState('warn');
  const [actionNote, setActionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports(1);
  }, [statusFilter]);

  const fetchReports = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/reports?status=${statusFilter}&page=${page}&limit=15`, { withCredentials: true });
      if (res.data.status) {
        setReports(res.data.data.reports || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAction = async () => {
    if (!selectedReport) return;
    setSubmitting(true);
    try {
      let nextStatus = 'resolved';
      let userAction = '';

      if (actionType === 'reject') {
        nextStatus = 'rejected';
      } else if (actionType === 'warn') {
        userAction = 'warn';
      } else if (actionType === 'suspend') {
        userAction = 'suspend';
      } else if (actionType === 'ban') {
        userAction = 'ban';
      }

      const res = await axios.patch(
        `${BASE_URL}/admin/reports/${selectedReport._id}`,
        {
          status: nextStatus,
          actionTaken: actionNote || `Report actioned: ${actionType}`,
          applyToUser: ['warn', 'suspend', 'ban'].includes(actionType),
          userAction
        },
        { withCredentials: true }
      );

      if (res.data.status) {
        setSelectedReport(null);
        setActionNote('');
        fetchReports(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Safety Violation Reports
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review flagged content, inspect reported accounts, and issue safety actions
            </p>
          </div>

          {/* Status Tabs */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto text-xs font-semibold">
            {['pending', 'reviewing', 'resolved', 'rejected', ''].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                  statusFilter === st ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st || 'All Reports'}
              </button>
            ))}
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Fetching reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-1 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-sm">No Reports in this Queue</h3>
            <p className="text-xs text-slate-400">All submitted reports in this category have been processed.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {reports.map((report) => (
              <div
                key={report._id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition-all shadow-2xs space-y-4"
              >
                {/* Header: Reason & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded text-xs font-semibold uppercase font-mono">
                      {report.reason.replace('-', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Report #{report._id.slice(-6)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded ${
                      report.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      report.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Main Body: Reporter vs Reported User */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Reporter Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3">
                    <img
                      src={report.reporterId?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                      alt="Reporter"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-[10px] font-semibold uppercase text-slate-400">Reporter</div>
                      <div className="font-semibold text-xs text-slate-900">
                        {report.reporterId ? `${report.reporterId.firstName} ${report.reporterId.lastName}` : 'Deleted User'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{report.reporterId?.email || '—'}</div>
                    </div>
                  </div>

                  {/* Reported User Box */}
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={report.reportedId?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                        alt="Reported User"
                        className="w-10 h-10 rounded-full object-cover border border-red-200"
                      />
                      <div>
                        <div className="text-[10px] font-semibold uppercase text-red-600">Reported Account</div>
                        <div className="font-semibold text-xs text-slate-900 flex items-center space-x-1.5">
                          <span>{report.reportedId ? `${report.reportedId.firstName} ${report.reportedId.lastName}` : 'Deleted User'}</span>
                          {report.reportedId?.isVerified && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] px-1 rounded">✓</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{report.reportedId?.email || '—'}</div>
                      </div>
                    </div>

                    {report.reportedId && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                        report.reportedId.accountStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {report.reportedId.accountStatus}
                      </span>
                    )}
                  </div>

                </div>

                {/* Report Description */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
                  <div className="font-semibold text-slate-500 text-[10px] uppercase mb-1">Report Description</div>
                  <p className="leading-relaxed">{report.description || 'No additional details provided.'}</p>
                </div>

                {/* Resolution Info */}
                {report.actionTaken && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center justify-between">
                    <span>Resolution: {report.actionTaken}</span>
                    <span className="text-[11px] text-emerald-700 font-mono">
                      By: {report.resolvedBy?.firstName || 'Staff Admin'}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                {report.status !== 'resolved' && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => { setSelectedReport(report); setActionType('warn'); }}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Issue Warning
                    </button>
                    <button
                      onClick={() => { setSelectedReport(report); setActionType('suspend'); }}
                      className="bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Suspend Account
                    </button>
                    <button
                      onClick={() => { setSelectedReport(report); setActionType('ban'); }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Ban Account
                    </button>
                    <button
                      onClick={() => { setSelectedReport(report); setActionType('reject'); }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

        {/* Action Modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
            <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <h3 className="font-bold text-base text-slate-900">
                Confirm Moderation Action: <span className="uppercase text-red-600 font-mono text-sm">{actionType}</span>
              </h3>

              <p className="text-xs text-slate-600">
                Applying action for Report #{selectedReport._id.slice(-6)} against{' '}
                <strong className="text-slate-900">
                  {selectedReport.reportedId ? `${selectedReport.reportedId.firstName} ${selectedReport.reportedId.lastName}` : 'the user'}
                </strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Action Note / Resolution Details
                </label>
                <textarea
                  rows="3"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Details for the audit log..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleResolveAction}
                  className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminReports;
