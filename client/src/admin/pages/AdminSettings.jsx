import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    appName: 'DevMeet',
    supportEmail: 'support@devmeet.com',
    maintenanceMode: false,
    maxPhotosPerUser: 6,
    minAgeRequirement: 18,
    maxAgeRequirement: 60,
    requirePhoneVerification: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/settings`, { withCredentials: true });
      if (res.data.status && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await axios.patch(
        `${BASE_URL}/admin/settings`,
        { settings },
        { withCredentials: true }
      );
      if (res.data.status) {
        setMessage('Application settings saved successfully.');
        setSettings(res.data.data);
      }
    } catch (err) {
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        
        {/* Header */}
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Platform Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure application branding, safety thresholds, and maintenance access
          </p>
        </div>

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3 flex items-center justify-between">
            <span>{message}</span>
            <span className="text-[10px] text-emerald-600 font-mono">Saved</span>
          </div>
        )}

        {loading ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400">Loading settings...</div>
        ) : (
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 text-xs shadow-2xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Application Name</label>
                <input
                  type="text"
                  value={settings.appName || 'DevMeet'}
                  onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl px-3.5 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail || 'support@devmeet.com'}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl px-3.5 py-2 text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Min Age Requirement</label>
                <input
                  type="number"
                  min="18"
                  max="30"
                  value={settings.minAgeRequirement || 18}
                  onChange={(e) => setSettings({ ...settings, minAgeRequirement: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl px-3.5 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Age Requirement</label>
                <input
                  type="number"
                  min="40"
                  max="100"
                  value={settings.maxAgeRequirement || 60}
                  onChange={(e) => setSettings({ ...settings, maxAgeRequirement: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl px-3.5 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Photos Allowed</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={settings.maxPhotosPerUser || 6}
                  onChange={(e) => setSettings({ ...settings, maxPhotosPerUser: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl px-3.5 py-2 text-slate-900 outline-none"
                />
              </div>
            </div>

            {/* Maintenance Mode & Toggles */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <div className="font-semibold text-slate-900 text-xs">Maintenance Mode</div>
                  <div className="text-[11px] text-slate-500">Temporarily restrict public access during scheduled database upgrades</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode || false}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <div className="font-semibold text-slate-900 text-xs">Require Phone Verification</div>
                  <div className="text-[11px] text-slate-500">Require users to provide valid mobile number before discovering profiles</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requirePhoneVerification || false}
                  onChange={(e) => setSettings({ ...settings, requirePhoneVerification: e.target.checked })}
                  className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                type="submit"
                disabled={saving}
                className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-xl font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

          </form>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
