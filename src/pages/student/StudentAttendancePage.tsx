import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
} from 'lucide-react';
import { AttendanceRecord, Subject, Student } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { exportToPDF, exportToCSV, ReportRow } from '../../utils/exportUtils';
import { calculateAttendanceStats } from '../../utils/attendanceCalculator';
import { Card, Button, Badge } from '../../components/common/UIComponents';

export const StudentAttendancePage: React.FC = () => {
  const { user } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      const stId = user?.studentId || 'student-1';
      const [st, atts, subs] = await Promise.all([
        dataService.getStudentById(stId),
        dataService.getAttendanceByStudent(stId),
        dataService.getSubjects(),
      ]);
      setStudent(st);
      setAttendance(atts);
      setSubjects(subs);
    };
    load();
  }, [user]);

  const filtered = attendance.filter((r) => {
    const matchSubject = selectedSubject === 'ALL' || r.subjectId === selectedSubject;
    const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    const matchDate = !dateFilter || r.date === dateFilter;
    return matchSubject && matchStatus && matchDate;
  });

  const handleExportReport = () => {
    const rows: ReportRow[] = subjects.map((sub) => {
      const subAtts = attendance.filter((a) => a.subjectId === sub.subjectId);
      const p = subAtts.filter((a) => a.status === 'Present').length;
      const ab = subAtts.filter((a) => a.status === 'Absent').length;
      const l = subAtts.filter((a) => a.status === 'Late').length;
      const stats = calculateAttendanceStats(p, ab, l, 75);
      return {
        studentName: student?.name || 'Alex Rivera',
        registerNumber: student?.registerNumber || 'REG2023CS042',
        subjectName: sub.subjectName,
        className: sub.classId.toUpperCase(),
        totalClasses: stats.totalConducted,
        present: stats.presentCount,
        absent: stats.absentCount,
        late: stats.lateCount,
        percentage: stats.percentage,
        statusRisk: stats.statusRisk,
      };
    });

    exportToPDF(
      `${student?.name || 'Student'} — Attendance Record`,
      `Roll No: ${student?.registerNumber} • Fall Term`,
      rows
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance History</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verified check-in timestamps, geolocation logs, and course participation records
          </p>
        </div>

        <Button variant="primary" icon={Download} onClick={handleExportReport}>
          Download Official Record
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.subjectCode} - {s.subjectName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Statuses</option>
              <option value="Present">Present Only</option>
              <option value="Absent">Absent Only</option>
              <option value="Late">Late Only</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </Card>

      {/* Attendance History Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Date & Slot</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification Method</th>
                <th className="py-3 px-4 text-right">Time Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No attendance records found for selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((rec) => (
                  <tr key={rec.attendanceId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{rec.subjectName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{rec.subjectId}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{rec.date}</p>
                      <p className="text-[11px] text-slate-400">{rec.period}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          rec.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.status === 'Absent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {rec.status === 'Present' && <CheckCircle className="w-3 h-3" />}
                        {rec.status === 'Absent' && <XCircle className="w-3 h-3" />}
                        {rec.status === 'Late' && <Clock className="w-3 h-3" />}
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-indigo-700 uppercase">
                      {rec.verificationMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
