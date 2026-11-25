import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { useAdmin } from '../context/AdminContext';

const AdminTeam = () => {
  const { isSuperAdmin } = useAdmin();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  // New staff modal state
  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Admin@12345');
  const [role, setRole] = useState('moderator');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/team`, { withCredentials: true });
      if (res.data.status) {
        setTeam(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await axios.post(
        `${BASE_URL}/admin/team`,
        { firstName, lastName, email, password, role },
        { withCredentials: true }
      );
      if (res.data.status) {
        setShowModal(false);
        setFirstName('');
        setLastName('');
        setEmail('');
        fetchTeam();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create staff account');
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
              Staff Team & Roles
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage internal team members (Moderators, Support Staff, and Administrators)
            </p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
            >
              + Add Staff Member
            </button>
          )}
        </div>

        {/* Staff Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Permissions Scope</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">Loading staff...</td>
                </tr>
              ) : team.map((member) => (
                <tr key={member._id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={member.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                        alt={member.firstName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">{member.firstName} {member.lastName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{member.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                      member.role === 'super-admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      member.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      member.role === 'moderator' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {member.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                    {member.role === 'super-admin' && 'Root Access: Roles, Database, System Settings'}
                    {member.role === 'admin' && 'Full Management: Users, Reports, Verifications, Content'}
                    {member.role === 'moderator' && 'Safety: Triage Reports, Review Uploaded Photos'}
                    {member.role === 'support' && 'Support: User profiles & Verification review'}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded uppercase font-mono">
                      {member.accountStatus || 'active'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Staff Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
            <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <h3 className="font-bold text-base text-slate-900">Create Staff Account</h3>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Min 4 chars"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Min 4 chars"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@devmeet.com"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none capitalize"
                  >
                    <option value="moderator">Moderator (Reports & Photos)</option>
                    <option value="support">Support Specialist (Verifications & Profiles)</option>
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="super-admin">Super Administrator (Root Access)</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminTeam;
