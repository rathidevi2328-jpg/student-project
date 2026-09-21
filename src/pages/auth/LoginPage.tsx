import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckSquare,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button, Input, Card } from '../../components/common/UIComponents';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login, switchRole } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both academic email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      showToast('success', 'Welcome Back', 'Logged in successfully.');
      if (email.includes('admin')) navigate('/admin/dashboard');
      else if (email.includes('faculty')) navigate('/faculty/dashboard');
      else navigate('/student/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: 'admin' | 'faculty' | 'student') => {
    setIsLoading(true);
    try {
      switchRole(role);
      showToast('success', `Demo Login as ${role.toUpperCase()}`, 'Access granted.');
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'faculty') navigate('/faculty/dashboard');
      else navigate('/student/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        {/* Brand Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 ring-8 ring-white/10 animate-scale-in">
          <CheckSquare className="w-9 h-9 stroke-[2.5]" />
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Smart<span className="text-indigo-400">Attend</span>
          </h1>
          <p className="text-xs text-indigo-200/80 font-medium mt-1">
            Smart Attendance. Simple Management.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-white/20 sm:px-10">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Sign in to your portal</h2>
              <p className="text-xs text-slate-500">Access your college attendance and course dashboard</p>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {errorMessage}
              </div>
            )}

            <Input
              label="Academic Email Address"
              type="email"
              placeholder="e.g. admin@smartattend.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full shadow-lg shadow-indigo-200"
              disabled={isLoading}
              icon={ArrowRight}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Quick Demo Logins for Instant Testing */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Instant Demo Accounts
              </span>
              <span className="text-[10px] text-slate-400 font-medium">1-Click Sign In</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-center group"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Admin</span>
                <span className="text-[9px] text-slate-400 truncate w-full">Full Control</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('faculty')}
                className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-center group"
              >
                <BookOpen className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Faculty</span>
                <span className="text-[9px] text-slate-400 truncate w-full">QR Sessions</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student')}
                className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-center group"
              >
                <GraduationCap className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Student</span>
                <span className="text-[9px] text-slate-400 truncate w-full">Camera Scan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
