import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { DashboardLayout } from '../components/layout/DashboardLayout';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { StudentsPage } from '../pages/admin/StudentsPage';
import { FacultyPage } from '../pages/admin/FacultyPage';
import { DepartmentsPage } from '../pages/admin/DepartmentsPage';
import { SubjectsPage } from '../pages/admin/SubjectsPage';
import { ClassesPage } from '../pages/admin/ClassesPage';
import { AdminAttendancePage } from '../pages/admin/AdminAttendancePage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';

// Faculty Pages
import { FacultyDashboardPage } from '../pages/faculty/FacultyDashboardPage';
import { FacultySubjectsPage } from '../pages/faculty/FacultySubjectsPage';
import { FacultyAttendancePage } from '../pages/faculty/FacultyAttendancePage';
import { FacultySessionsPage } from '../pages/faculty/FacultySessionsPage';
import { FacultyReportsPage } from '../pages/faculty/FacultyReportsPage';

// Student Pages
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage';
import { StudentScanPage } from '../pages/student/StudentScanPage';
import { StudentAttendancePage } from '../pages/student/StudentAttendancePage';
import { StudentCalendarPage } from '../pages/student/StudentCalendarPage';
import { StudentProfilePage } from '../pages/student/StudentProfilePage';
import { StudentNotificationsPage } from '../pages/student/StudentNotificationsPage';

// Protected Route Wrapper enforcing role access
interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    // Redirect to their respective authorized home
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};

// Root index redirector
const RootRedirect: React.FC = () => {
  const { user, role, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Auth Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="faculty" element={<FacultyPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="attendance" element={<AdminAttendancePage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* FACULTY ROUTES */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={['faculty', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/faculty/dashboard" replace />} />
        <Route path="dashboard" element={<FacultyDashboardPage />} />
        <Route path="subjects" element={<FacultySubjectsPage />} />
        <Route path="attendance" element={<FacultyAttendancePage />} />
        <Route path="sessions" element={<FacultySessionsPage />} />
        <Route path="reports" element={<FacultyReportsPage />} />
      </Route>

      {/* STUDENT ROUTES */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="scan" element={<StudentScanPage />} />
        <Route path="attendance" element={<StudentAttendancePage />} />
        <Route path="calendar" element={<StudentCalendarPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="notifications" element={<StudentNotificationsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
