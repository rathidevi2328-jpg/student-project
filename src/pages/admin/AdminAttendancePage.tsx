import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  QrCode,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AttendanceRecord, Subject, CollegeClass } from '../../types';
import { dataService } from '../../services/dataService';
import { Card, Button, Input, Select, Badge } from '../../components/common/UIComponents';

export const AdminAttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<CollegeClass[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const loadData = async () => {
      const [atts, subs, cls] = await Promise.all([
        dataService.getAttendanceRecords(),
        dataService.getSubjects(),
        dataService.getClasses(),
      ]);
      setAttendance(atts);
      setSubjects(subs);
      setClasses(cls);
    };
    loadData();
  }, []);

  const filtered = attendance.filter((rec) => {
    const matchSearch =
      rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.subjectName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSubject = subjectFilter === 'ALL' || rec.subjectId === subjectFilter;
    const matchStatus = statusFilter === 'ALL' || rec.status === statusFilter;
    const matchDate = !dateFilter || rec.date === dateFilter;

    return matchSearch && matchSubject && matchStatus && matchDate;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">All Attendance Logs</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit-level ledger of all session attendances, QR scans, and verification telemetry
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
          Total Logged: {filtered.length} records
        </span>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search student, reg no, or course..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setCurrentPage(1);
              }}
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Date & Period</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification Method</th>
                <th className="py-3 px-4">Geo & Face</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                paginated.map((rec) => (
                  <tr key={rec.attendanceId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{rec.studentName}</p>
                      <p className="text-[11px] font-mono text-slate-400">{rec.registerNumber}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{rec.subjectName}</p>
                      <p className="text-[11px] text-slate-400">{rec.classId.toUpperCase()}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{rec.date}</p>
                      <p className="text-[11px] text-slate-400">{rec.period || 'Session Period'}</p>
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
                    <td className="py-3 px-4 font-mono text-[11px] uppercase text-indigo-700">
                      {rec.verificationMethod}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            rec.locationVerified
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                          title={rec.locationVerified ? 'Location verified within radius' : 'Not verified'}
                        >
                          <MapPin className="w-3 h-3" /> Geo
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            rec.faceVerified
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                          title={rec.faceVerified ? 'Face verified' : 'Not verified'}
                        >
                          Face
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
