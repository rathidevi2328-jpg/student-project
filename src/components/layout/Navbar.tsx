import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Bell,
  LogOut,
  RefreshCw,
  User,
  Shield,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { dataService } from '../../services/dataService';
import { UserRole } from '../../types';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, logout, switchRole } = useAuth();
  const { notifications, unreadCount, markAsRead, showToast } = useNotifications();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
    showToast('info', 'Role Switched', `Now viewing application as ${newRole.toUpperCase()}`);
    if (newRole === 'admin') navigate('/admin/dashboard');
    else if (newRole === 'faculty') navigate('/faculty/dashboard');
    else navigate('/student/dashboard');
  };

  const handleResetSeedData = async () => {
    if (confirm('Reset SmartAttend to initial seed data? This will restore realistic demo students, attendance records, and faculty.')) {
      setIsResetting(true);
      await dataService.resetToSeedData();
      showToast('success', 'Data Restored', 'SmartAttend seed dataset has been refreshed.');
      setIsResetting(false);
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => {
              if (role === 'admin') navigate('/admin/dashboard');
              else if (role === 'faculty') navigate('/faculty/dashboard');
              else navigate('/student/dashboard');
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-all">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Smart<span className="text-indigo-600">Attend</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden md:block">
                Smart Attendance. Simple Management.
              </p>
            </div>
          </div>
        </div>

        {/* Center: Role Switcher Toolbar */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => handleRoleChange('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              role === 'admin'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin
          </button>
          <button
            onClick={() => handleRoleChange('faculty')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              role === 'faculty'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Faculty
          </button>
          <button
            onClick={() => handleRoleChange('student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              role === 'student'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Student
          </button>
        </div>

        {/* Right Actions: Seed Data, Notifications, Profile */}
        <div className="flex items-center gap-2">
          {/* Quick Seed Reset */}
          <button
            onClick={handleResetSeedData}
            disabled={isResetting}
            title="Reset to fresh demo seed data"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Seed Data</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse-subtle">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-scale-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-indigo-600" /> Notifications
                  </h4>
                  <span className="text-xs text-slate-400">{unreadCount} unread</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 mt-2">
                  {notifications.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.notificationId}
                        onClick={() => markAsRead(n.notificationId)}
                        className={`py-3 px-2 rounded-xl text-left cursor-pointer transition-colors ${
                          !n.read ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              !n.read ? 'bg-indigo-600' : 'bg-transparent'
                            }`}
                          />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="hidden lg:block text-left pr-1">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{role}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-in">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1.5 inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-50 text-indigo-700">
                    Role: {role}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (role === 'student') navigate('/student/profile');
                      else if (role === 'faculty') navigate('/faculty/dashboard');
                      else navigate('/admin/settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
