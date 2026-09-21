import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, FileText, Filter, Calendar } from 'lucide-react';
import { Department, CollegeClass, Subject, Student, AttendanceRecord } from '../../types';
import { dataService } from '../../services/dataService';
import { exportToCSV, exportToPDF, ReportRow } from '../../utils/exportUtils';
import { calculateAttendanceStats } from '../../utils/attendanceCalculator';
import { Card, Button, Select, Input, Badge } from '../../components/common/UIComponents';

export const AdminReportsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<CollegeClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Filters
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [d, c, sub, st, a] = await Promise.all([
        dataService.getDepartments(),
        dataService.getClasses(),
        dataService.getSubjects(),
        dataService.getStudents(),
        dataService.getAttendanceRecords(),
      ]);
      setDepartments(d);
      setClasses(c);
      setSubjects(sub);
      setStudents(st);
      setAttendance(a);
    };
    loadData();
  }, []);

  // Filter attendance records by date range
  const filteredRecords = attendance.filter((rec) => {
    if (startDate && rec.date < startDate) return false;
    if (endDate && rec.date > endDate) return false;
    return true;
  });

  // Generate aggregate report rows
  // Student Name, Register Number, Subject, Total Classes, Present, Absent, Attendance %
  const reportRows: ReportRow[] = [];

  const targetSubjects = selectedSubject === 'ALL'
    ? subjects
    : subjects.filter((s) => s.subjectId === selectedSubject);

  const targetStudents = students.filter((st) => {
    if (!st.isActive) return false;
    if (selectedDept !== 'ALL' && st.departmentId !== selectedDept) return false;
    return true;
  });

  targetStudents.forEach((student) => {
    targetSubjects.forEach((sub) => {
      const studentSubjectRecords = filteredRecords.filter(
        (r) => r.studentId === student.studentId && r.subjectId === sub.subjectId
      );

      if (studentSubjectRecords.length > 0 || selectedSubject !== 'ALL') {
        const p = studentSubjectRecords.filter((r) => r.status === 'Present').length;
        const ab = studentSubjectRecords.filter((r) => r.status === 'Absent').length;
        const l = studentSubjectRecords.filter((r) => r.status === 'Late').length;
        const stats = calculateAttendanceStats(p, ab, l, 75);

        reportRows.push({
          studentName: student.name,
          registerNumber: student.registerNumber,
          subjectName: sub.subjectName,
          className: sub.classId.toUpperCase(),
          totalClasses: stats.totalConducted,
          present: stats.presentCount,
          absent: stats.absentCount,
          late: stats.lateCount,
          percentage: stats.percentage,
          statusRisk: stats.statusRisk,
        });
      }
    });
  });

  const handleExportCSV = () => {
    exportToCSV('SmartAttend_Student_Attendance_Report', reportRows);
  };

  const handleExportPDF = () => {
    const subtitle = `Filter: Dept: ${selectedDept}, Class: ${selectedClass}, Subject: ${selectedSubject} | Records: ${reportRows.length}`;
    exportToPDF('Official Student Attendance Ledger', subtitle, reportRows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Generate, filter, and export comprehensive student attendance reports (CSV & PDF)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExportCSV}
            disabled={reportRows.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            icon={FileText}
            onClick={handleExportPDF}
            disabled={reportRows.length === 0}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filter Matrix */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentCode} - {d.departmentName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Classes</option>
              {classes.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.className}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </Card>

      {/* Generated Report Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Register Number</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Total Classes</th>
                <th className="py-3 px-4">Present</th>
                <th className="py-3 px-4">Absent</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">Risk Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {reportRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No data matching selected report filters.
                  </td>
                </tr>
              ) : (
                reportRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.studentName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 font-semibold">{row.registerNumber}</td>
                    <td className="py-3 px-4">{row.subjectName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{row.totalClasses}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">{row.present}</td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">{row.absent}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono font-black text-xs ${
                          row.percentage < 75 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {row.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          row.percentage < 75
                            ? 'danger'
                            : row.percentage < 80
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {row.statusRisk || (row.percentage >= 75 ? 'Low Risk' : 'High Risk')}
                      </Badge>
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
