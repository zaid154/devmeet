import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { useAdmin } from '../context/AdminContext';
import { SearchIcon, TrashIcon, CheckBadgeIcon } from '../components/AdminIcons';

const AdminUsers = () => {
  const { isSuperAdmin } = useAdmin();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Selected user for details modal
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  // Status action modal
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [targetStatus, setTargetStatus] = useState('suspended');
  const [statusReason, setStatusReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers(1);
  }, [statusFilter, roleFilter, verificationFilter, genderFilter]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        role: roleFilter,
        verification: verificationFilter,
        gender: genderFilter,
      });

      const res = await axios.get(`${BASE_URL}/admin/users?${params.toString()}`, { withCredentials: true });
      if (res.data.status) {
        setUsers(res.data.data.users || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const openUserDetails = async (userId) => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/users/${userId}`, { withCredentials: true });
      if (res.data.status) {
        setSelectedUserDetail(res.data.data);
      }
    } catch (e) {
      alert('Failed to load user details');
    }
  };

  const handleStatusSubmit = async () => {
    if (!statusModalUser) return;
    setActionLoading(true);
    try {
      const res = await axios.patch(
        `${BASE_URL}/admin/users/${statusModalUser._id}/status`,
        { status: targetStatus, reason: statusReason },
        { withCredentials: true }
      );
      if (res.data.status) {
        setStatusModalUser(null);
        setStatusReason('');
        fetchUsers(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyToggle = async (user) => {
    const nextVerify = !user.isVerified;
    if (!window.confirm(`Are you sure you want to ${nextVerify ? 'APPROVE' : 'REVOKE'} verification for ${user.firstName}?`)) return;
    try {
      await axios.patch(`${BASE_URL}/admin/users/${user._id}/verify`, { isVerified: nextVerify }, { withCredentials: true });
      fetchUsers(pagination.page);
    } catch (err) {
      alert('Verification update failed');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Permanent Delete: Are you sure you want to delete user ${user.firstName} ${user.lastName} (${user.email})?`)) return;
    try {
      await axios.delete(`${BASE_URL}/admin/users/${user._id}`, { withCredentials: true });
      fetchUsers(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              User Directory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Search accounts, inspect profile details, manage verification badges, and apply account restrictions
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
            Total Users: <strong className="text-slate-900">{pagination.total}</strong>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <SearchIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, location, phone..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-800 text-slate-900 pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Filter
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none"
            >
              <option value="">Status: All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none"
            >
              <option value="">Verification: All</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending Review</option>
              <option value="unverified">Unverified</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none"
            >
              <option value="">Role: All</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
              <option value="super-admin">Super Admin</option>
            </select>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none"
            >
              <option value="">Gender: All</option>
              <option value="female">Women</option>
              <option value="male">Men</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Location & Job</th>
                  <th className="py-3 px-3">Verification</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">Loading directory...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">No users match query.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                            alt={u.firstName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                              <span>{u.firstName} {u.lastName}</span>
                              <span className="text-[11px] text-slate-400">({u.age || '—'})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                          u.role === 'super-admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          u.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          u.role === 'moderator' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{u.location || '—'}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{u.job || '—'}</div>
                      </td>

                      <td className="py-3 px-3">
                        {u.isVerified ? (
                          <span className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium">
                            <span>✓</span>
                            <span>Verified</span>
                          </span>
                        ) : u.verificationStatus === 'pending' ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">
                            Pending
                          </span>
                        ) : (
                          <span className="text-slate-400">Unverified</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase font-mono ${
                          u.accountStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          u.accountStatus === 'suspended' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {u.accountStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => openUserDetails(u._id)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Details
                          </button>

                          <button
                            onClick={() => { setStatusModalUser(u); setTargetStatus(u.accountStatus === 'active' ? 'suspended' : 'active'); }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                              u.accountStatus === 'active' ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {u.accountStatus === 'active' ? 'Restrict' : 'Restore'}
                          </button>

                          <button
                            onClick={() => handleVerifyToggle(u)}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg text-xs cursor-pointer font-semibold"
                          >
                            {u.isVerified ? 'Revoke' : 'Verify'}
                          </button>

                          {isSuperAdmin && u.role !== 'super-admin' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer"
                              title="Delete account"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Page <strong className="text-slate-900">{pagination.page}</strong> of {pagination.totalPages}
              </div>
              <div className="flex space-x-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchUsers(pagination.page - 1)}
                  className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchUsers(pagination.page + 1)}
                  className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* USER DETAILS MODAL */}
        {selectedUserDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-xl my-auto animate-in zoom-in-95">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">
                  User Details: {selectedUserDetail.user.firstName} {selectedUserDetail.user.lastName}
                </h3>
                <button onClick={() => setSelectedUserDetail(null)} className="text-slate-400 hover:text-slate-700 text-base font-bold">✕</button>
              </div>

              {/* Top Banner */}
              <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <img
                  src={selectedUserDetail.user.profileImage}
                  alt="Profile"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-300"
                />
                <div className="space-y-1">
                  <div className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <span>{selectedUserDetail.user.firstName} {selectedUserDetail.user.lastName}</span>
                    <span className="text-xs text-slate-500 font-normal">({selectedUserDetail.user.age}, {selectedUserDetail.user.gender})</span>
                    {selectedUserDetail.user.isVerified && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-1.5 py-0.2 rounded">Verified</span>}
                  </div>
                  <div className="text-xs text-slate-500">{selectedUserDetail.user.email} • {selectedUserDetail.user.phone}</div>
                  <div className="text-xs text-slate-600 font-medium">{selectedUserDetail.user.job || 'No Job Listed'} • {selectedUserDetail.user.location || 'Remote'}</div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="font-bold text-base text-slate-900">{selectedUserDetail.stats.matches}</div>
                  <div className="text-slate-500 text-[11px] uppercase">Matches</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="font-bold text-base text-amber-700">{selectedUserDetail.stats.reportsReceived}</div>
                  <div className="text-slate-500 text-[11px] uppercase">Reports Against</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="font-bold text-base text-blue-700">{selectedUserDetail.stats.reportsSubmitted}</div>
                  <div className="text-slate-500 text-[11px] uppercase">Reports Filed</div>
                </div>
              </div>

              {/* Bio & Skills */}
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-slate-700">Bio</div>
                <p className="bg-slate-50 p-3 rounded-xl text-slate-700 leading-relaxed border border-slate-200">
                  {selectedUserDetail.user.bio || 'No bio provided'}
                </p>

                <div className="font-semibold text-slate-700 pt-1">Skills & Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUserDetail.user.skills?.map((s, i) => (
                    <span key={i} className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-semibold text-[11px]">
                      {s}
                    </span>
                  ))}
                  {selectedUserDetail.user.interests?.map((item, i) => (
                    <span key={i} className="bg-red-50 text-red-700 border border-red-100 px-2.5 py-0.5 rounded-md text-[11px]">
                      #{item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Photo Gallery */}
              {selectedUserDetail.user.photos?.length > 0 && (
                <div className="space-y-2">
                  <div className="font-semibold text-slate-700">Photo Gallery ({selectedUserDetail.user.photos.length})</div>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedUserDetail.user.photos.map((p, idx) => (
                      <img key={idx} src={p} alt="Gallery" className="w-full h-20 rounded-xl object-cover border border-slate-200" />
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 text-right border-t border-slate-100">
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="bg-slate-900 hover:bg-black text-white font-semibold px-5 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* USER STATUS MODAL */}
        {statusModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
            <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              
              <h3 className="font-bold text-base text-slate-900">
                Update Status: {statusModalUser.firstName} {statusModalUser.lastName}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Account Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                >
                  <option value="active">Active (Standard Access)</option>
                  <option value="suspended">Suspended (Temporary Review)</option>
                  <option value="banned">Banned (Permanent Revocation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Trail Reason</label>
                <textarea
                  rows="3"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Provide rationale for the account status modification..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusModalUser(null)}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleStatusSubmit}
                  className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Applying...' : 'Apply Status'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
