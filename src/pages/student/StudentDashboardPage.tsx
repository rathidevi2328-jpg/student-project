import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  Calendar,
  AlertTriangle,
  Download,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Percent,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { calculateAttendanceStats, AttendanceSummary } from '../../utils/attendanceCalculator';
import { exportToPDF, ReportRow } from '../../utils/exportUtils';
import { Student, Subject, AttendanceRecord } from '../../types';
import { Card, Button, Badge } from '../../components/common/UIComponents';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      const stId = user?.studentId || 'student-1';
      const [st, subs, atts] = await Promise.all([
        dataService.getStudentById(stId),
        dataService.getSubjects(),
        dataService.getAttendanceByStudent(stId),
      ]);
      setStudent(st);
      setSubjects(subs);
      setAttendance(atts);
    };
    load();
  }, [user]);

  // Overall attendance calculations
  const presentCount = attendance.filter((a) => a.status === 'Present').length;
  const absentCount = attendance.filter((a) => a.status === 'Absent').length;
  const lateCount = attendance.filter((a) => a.status === 'Late').length;
  const overallStats = calculateAttendanceStats(presentCount, absentCount, lateCount, 75);

  // Subject-wise stats
  const subjectStats = subjects.map((sub) => {
    const subAtts = attendance.filter((a) => a.subjectId === sub.subjectId);
    const p = subAtts.filter((a) => a.status === 'Present').length;
    const ab = subAtts.filter((a) => a.status === 'Absent').length;
    const l = subAtts.filter((a) => a.status === 'Late').length;
    const stats = calculateAttendanceStats(p, ab, l, 75);
    return {
      subject: sub,
      stats,
    };
  });

  // Low attendance warning subjects (< 75%)
  const warningSubjects = subjectStats.filter((s) => s.stats.isBelowThreshold);

  // Recent attendance (last 5 sessions)
  const recentRecords = [...attendance]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const handleDownloadReport = () => {
    const rows: ReportRow[] = subjectStats.map(({ subject, stats }) => ({
      studentName: student?.name || 'Alex Rivera',
      registerNumber: student?.registerNumber || 'REG2023CS042',
      subjectName: subject.subjectName,
      className: subject.classId.toUpperCase(),
      totalClasses: stats.totalConducted,
      present: stats.presentCount,
      absent: stats.absentCount,
      late: stats.lateCount,
      percentage: stats.percentage,
      statusRisk: stats.statusRisk,
    }));

    exportToPDF(
      `${student?.name || 'Student'} — Academic Attendance Report`,
      `Register No: ${student?.registerNumber} • Term: Fall 2026`,
      rows
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Student Welcome Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
            Student Attendance Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-black mt-2">
            Good Morning, {student?.name || 'Alex Rivera'}
          </h1>
          <p className="text-xs md:text-sm text-indigo-200/80 mt-1 max-w-lg">
            Roll: <span className="font-mono font-bold text-white">{student?.registerNumber || 'REG2023CS042'}</span> • {student?.course || 'B.Tech Computer Science'}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Button
            variant="primary"
            size="lg"
            icon={QrCode}
            onClick={() => navigate('/student/scan')}
            className="bg-white text-indigo-950 hover:bg-slate-100 font-bold shadow-lg"
          >
            Scan Attendance QR
          </Button>
          <Button
            variant="outline"
            size="lg"
            icon={Download}
            onClick={handleDownloadReport}
            className="border-white/30 text-white hover:bg-white/10"
          >
            Download Report
          </Button>
        </div>
      </div>

      {/* Low Attendance Alert Banner if any subject is < 75% (Section 19 requirement) */}
      {warningSubjects.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-start gap-3 shadow-sm animate-scale-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs md:text-sm font-bold text-rose-950">
              ⚠️ Low Attendance Warning
            </h4>
            <div className="mt-1 space-y-1">
              {warningSubjects.map(({ subject, stats }) => (
                <p key={subject.subjectId} className="text-xs text-rose-800">
                  Your attendance in <strong>{subject.subjectName}</strong> is{' '}
                  <span className="font-bold underline">{stats.percentage}%</span>. Minimum required attendance: <strong>75%</strong>.
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overall Attendance Metric Cards (Section 21 requirement) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Overall Attendance</span>
          <p className="text-3xl font-black text-indigo-600 font-mono mt-1">
            {overallStats.percentage}%
          </p>
          <span className="text-[11px] font-medium text-slate-500">Institutional Standard: 75%</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Present</span>
          <p className="text-3xl font-black text-emerald-600 font-mono mt-1">
            {presentCount}
          </p>
          <span className="text-[11px] font-medium text-emerald-600">Sessions Attended</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Absent</span>
          <p className="text-3xl font-black text-rose-600 font-mono mt-1">
            {absentCount}
          </p>
          <span className="text-[11px] font-medium text-rose-600">Missed Classes</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Total Classes</span>
          <p className="text-3xl font-black text-slate-900 font-mono mt-1">
            {overallStats.totalConducted}
          </p>
          <span className="text-[11px] font-medium text-slate-500">Conducted This Term</span>
        </div>
      </div>

      {/* Subject Cards Grid (Section 21 requirement) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">Course Subject Attendance</h2>
          <span className="text-xs text-slate-400">Minimum requirement: 75%</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectStats.map(({ subject, stats }) => (
            <Card
              key={subject.subjectId}
              className={`hover:shadow-md transition-all ${
                stats.isBelowThreshold ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700">
                  {subject.subjectCode}
                </span>
                {stats.isBelowThreshold && (
                  <span className="text-rose-600 text-xs font-bold flex items-center gap-0.5">
                    ⚠️ Low
                  </span>
                )}
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-sm text-slate-900 leading-snug">{subject.subjectName}</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span
                    className={`text-2xl font-black font-mono ${
                      stats.isBelowThreshold ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {stats.percentage}%
                  </span>
                  <span className="text-xs text-slate-400">
                    ({stats.presentCount}/{stats.totalConducted})
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    stats.isBelowThreshold ? 'bg-rose-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, stats.percentage)}%` }}
                />
              </div>

              {/* Smart Prediction Indicator (Section 20 requirement) */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                {stats.isBelowThreshold ? (
                  <p className="text-rose-700 font-medium">
                    Attend next <strong>{stats.classesNeededFor75}</strong> classes consecutively to reach 75%.
                  </p>
                ) : (
                  <p className="text-emerald-700 font-medium">
                    Can miss up to <strong>{stats.classesCanMissAbove75}</strong> classes while staying ≥75%.
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Smart Feature & Attendance Prediction Box (Section 20 requirement) */}
      <Card
        title="Attendance Risk Analytics & Mathematical Prediction"
        subtitle="Transparent academic trajectory estimation based on current attendance trend and mandatory 75% standard"
        className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-400">Overall Attendance Risk Tier</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xl font-black ${
                  overallStats.statusRisk === 'High Risk'
                    ? 'text-rose-600'
                    : overallStats.statusRisk === 'Medium Risk'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {overallStats.statusRisk}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {overallStats.statusRisk === 'Low Risk'
                ? 'Your attendance buffer is solid. Maintain regular attendance.'
                : overallStats.statusRisk === 'Medium Risk'
                ? 'You are near the 75% threshold. A missed class could place you at risk.'
                : 'Immediate action required. Low attendance warning is active.'}
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-400">Classes Needed to Reach 75%</span>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {overallStats.classesNeededFor75}{' '}
              <span className="text-xs font-normal text-slate-400">classes</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Calculated using formula: <code>⌈(0.75×Total - Present) / 0.25⌉</code>
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-400">Buffer Classes That Can Be Missed</span>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {overallStats.classesCanMissAbove75}{' '}
              <span className="text-xs font-normal text-slate-400">classes</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Calculated using formula: <code>⌊(Present - 0.75×Total) / 0.75⌋</code>
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Attendance Records (Section 21 requirement) */}
      <Card
        title="Recent Attendance Activity"
        subtitle="Last 5 lecture check-ins"
        headerAction={
          <button
            onClick={() => navigate('/student/attendance')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View Full History <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        <div className="divide-y divide-slate-100">
          {recentRecords.map((rec) => (
            <div key={rec.attendanceId} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">{rec.subjectName}</p>
                <p className="text-[11px] text-slate-400">
                  {rec.date} • {rec.period} • Method: {rec.verificationMethod}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  rec.status === 'Present'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : rec.status === 'Absent'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {rec.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
