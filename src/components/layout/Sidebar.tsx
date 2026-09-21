import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  BookOpen,
  CalendarDays,
  FileSpreadsheet,
  QrCode,
  ShieldCheck,
  History,
  Sliders,
  Bell,
  User,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, user } = useAuth();

  const adminLinks = [
    { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', to: '/admin/students', icon: GraduationCap },
    { name: 'Faculty', to: '/admin/faculty', icon: Users },
    { name: 'Departments', to: '/admin/departments', icon: Building2 },
    { name: 'Subjects', to: '/admin/subjects', icon: BookOpen },
    { name: 'Classes', to: '/admin/classes', icon: Layers },
    { name: 'All Attendance', to: '/admin/attendance', icon: UserCheck },
    { name: 'Reports & Export', to: '/admin/reports', icon: FileSpreadsheet },
    { name: 'Settings & Geo', to: '/admin/settings', icon: Sliders },
    { name: 'Audit Logs', to: '/admin/audit-logs', icon: History },
  ];

  const facultyLinks = [
    { name: 'Dashboard', to: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'My Subjects', to: '/faculty/subjects', icon: BookOpen },
    { name: 'QR Sessions', to: '/faculty/sessions', icon: QrCode },
    { name: 'Manual Attendance', to: '/faculty/attendance', icon: UserCheck },
    { name: 'Class Reports', to: '/faculty/reports', icon: FileSpreadsheet },
  ];

  const studentLinks = [
    { name: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Scan QR Code', to: '/student/scan', icon: QrCode, badge: 'Active' },
    { name: 'My Attendance', to: '/student/attendance', icon: UserCheck },
    { name: 'Calendar View', to: '/student/calendar', icon: CalendarDays },
    { name: 'Notifications', to: '/student/notifications', icon: Bell },
    { name: 'Profile & Face Data', to: '/student/profile', icon: User },
  ];

  let links = studentLinks;
  if (role === 'admin') links = adminLinks;
  else if (role === 'faculty') links = facultyLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 pt-16 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-sm">
              {role === 'admin' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : role === 'faculty' ? (
                <BookOpen className="w-5 h-5" />
              ) : (
                <GraduationCap className="w-5 h-5" />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 capitalize truncate">{role} Portal</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.name || 'Active User'}</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-white animate-pulse-subtle">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <p className="font-semibold text-slate-600">SmartAttend v1.0.0</p>
            <p>Production Ready System</p>
          </div>
        </div>
      </aside>
    </>
  );
};
