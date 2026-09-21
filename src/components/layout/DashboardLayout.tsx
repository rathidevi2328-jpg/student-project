import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:pl-64 flex flex-col">
          <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
            <Outlet />
          </div>
          <footer className="py-4 px-8 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/40">
            SmartAttend — Smart Attendance. Simple Management. © {new Date().getFullYear()}
          </footer>
        </main>
      </div>
    </div>
  );
};
