import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import {
  DashboardIcon,
  UsersIcon,
  ShieldAlertIcon,
  CheckBadgeIcon,
  PhotoFilterIcon,
  MegaphoneIcon,
  SlidersIcon,
  UserGroupIcon,
  HistoryLogIcon,
  SettingsIcon
} from './AdminIcons';

const AdminLayout = ({ children }) => {
  const { admin, logoutAdmin, isSuperAdmin } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: DashboardIcon },
    { name: 'Users', path: '/admin/users', icon: UsersIcon },
    { name: 'Reports', path: '/admin/reports', icon: ShieldAlertIcon },
    { name: 'Verifications', path: '/admin/verifications', icon: CheckBadgeIcon },
    { name: 'Moderation', path: '/admin/moderation', icon: PhotoFilterIcon },
    { name: 'Media CMS', path: '/admin/media', icon: PhotoFilterIcon },
    { name: 'Announcements', path: '/admin/announcements', icon: MegaphoneIcon },
    { name: 'Feature Flags', path: '/admin/features', icon: SlidersIcon },
    { name: 'Staff Team', path: '/admin/team', icon: UserGroupIcon, restricted: !isSuperAdmin },
    { name: 'Activity Logs', path: '/admin/activity-logs', icon: HistoryLogIcon },
    { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super-admin': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'admin': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'moderator': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'support': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased">
      
      {/* Top Admin Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900"
          >
            ☰
          </button>
          
          <Link to="/admin" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fe3c72] text-white flex items-center justify-center font-black text-sm shadow-xs">
              D
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-slate-900">
                Dev<span className="text-[#fe3c72]">Meet</span>
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600">
                Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Staff Profile & Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4 text-xs font-medium">
          
          <Link
            to="/feed"
            target="_blank"
            className="hidden sm:flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            <span>Live Application</span>
            <span className="text-[10px] text-slate-400">↗</span>
          </Link>

          {/* Admin User Info */}
          <div className="flex items-center space-x-2.5 pl-2 sm:border-l sm:border-slate-200">
            {admin?.profileImage ? (
              <img
                src={admin.profileImage}
                alt={admin.firstName}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                {admin?.firstName?.[0] || 'A'}
              </div>
            )}
            
            <div className="hidden md:block text-left">
              <div className="font-semibold text-slate-900 text-xs leading-none">
                {admin?.firstName} {admin?.lastName}
              </div>
              <div className="mt-1">
                <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border font-semibold ${getRoleBadge(admin?.role)}`}>
                  {admin?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logoutAdmin}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer text-xs"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0
          ${sidebarOpen ? 'translate-x-0 pt-16 md:pt-0 shadow-lg' : '-translate-x-full'}
        `}>
          <div className="p-3 space-y-1 overflow-y-auto">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
              Management
            </div>

            {menuItems.filter(item => !item.restricted).map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-colors
                    ${isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200 text-[11px] text-slate-500 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span>Environment</span>
              <span className="flex items-center space-x-1.5 text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Operational</span>
              </span>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-[#f8fafc] p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
