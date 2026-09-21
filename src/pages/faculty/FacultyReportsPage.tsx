import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, FileText, Bell, Send, AlertTriangle } from 'lucide-react';
import { Subject, CollegeClass, Student, AttendanceRecord } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { calculateAttendanceStats } from '../../utils/attendanceCalculator';
import { exportToCSV, exportToPDF, ReportRow } from '../../utils/exportUtils';
import { Card, Button, Badge } from '../../components/common/UIComponents';

export const FacultyReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      const facId = user?.facultyId || 'faculty-1';
      const [subs, sts, atts] = await Promise.all([
        dataService.getSubjectsByFaculty(facId),
        dataService.getStudents(),
        dataService.getAttendanceRecords(),
      ]);

      let assigned = subs;
      if (assigned.length === 0) {
        const all = await dataService.getSubjects();
        assigned = all.slice(0, 3);
      }
      setSubjects(assigned);
      if (assigned.length > 0) setSelectedSubjectId(assigned[0].subjectId);
      setStudents(sts.filter((s) => s.isActive));
      setAttendance(atts);
    };
    load();
  }, [user]);

  const currentSubject = subjects.find((s) => s.subjectId === selectedSubjectId);

  // Generate rows
  const reportRows: ReportRow[] = [];
  if (currentSubject) {
    const subAtts = attendance.filter((a) => a.subjectId === currentSubject.subjectId);
    students.forEach((st) => {
      const stAtts = subAtts.filter((a) => a.studentId === st.studentId);
      const p = stAtts.filter((a) => a.status === 'Present').length;
      const ab = stAtts.filter((a) => a.status === 'Absent').length;
      const l = stAtts.filter((a) => a.status === 'Late').length;
      const stats = calculateAttendanceStats(p, ab, l, 75);

      reportRows.push({
        studentName: st.name,
        registerNumber: st.registerNumber,
        subjectName: currentSubject.subjectName,
        className: currentSubject.classId.toUpperCase(),
        totalClasses: stats.totalConducted,
        present: stats.presentCount,
        absent: stats.absentCount,
        late: stats.lateCount,
        percentage: stats.percentage,
        statusRisk: stats.statusRisk,
      });
    });
  }

  const handleExportCSV = () => {
    if (!currentSubject) return;
    exportToCSV(`SmartAttend_${currentSubject.subjectCode}_Report`, reportRows);
  };

  const handleExportPDF = () => {
    if (!currentSubject) return;
    exportToPDF(
      `${currentSubject.subjectName} (${currentSubject.subjectCode}) Report`,
      `Faculty: ${user?.name} | Total Students: ${reportRows.length}`,
      reportRows
    );
  };

  // Send Attendance Alerts (Section 3 Faculty requirement)
  const handleSendAttendanceAlerts = async () => {
    const atRiskStudents = reportRows.filter((r) => r.percentage < 75);
    if (atRiskStudents.length === 0) {
      showToast('info', 'No Alerts Needed', 'All students currently meet or exceed the 75% requirement.');
      return;
    }

    for (const r of atRiskStudents) {
      const matched = students.find((s) => s.registerNumber === r.registerNumber);
      if (matched) {
        await dataService.addNotification({
          notificationId: `alert-${Date.now()}-${matched.studentId}`,
          userId: matched.studentId,
          role: 'student',
          title: `⚠️ Attendance Alert: ${currentSubject?.subjectName}`,
          message: `Your current attendance is ${r.percentage}% (below 75%). Please contact Professor ${user?.name} to discuss academic eligibility.`,
          type: 'warning',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await dataService.logAction({
      userId: user?.uid || 'faculty-1',
      userName: user?.name || 'Faculty',
      role: 'faculty',
      action: `Sent Attendance Warnings for ${currentSubject?.subjectName}`,
      metadata: { warnedCount: atRiskStudents.length },
    });

    showToast(
      'success',
      'Alerts Dispatched',
      `Sent low attendance warnings to ${atRiskStudents.length} students.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subject Attendance Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Export official records, review individual participation rates, and dispatch student warnings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={Bell}
            onClick={handleSendAttendanceAlerts}
            className="text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
          >
            Send Low Attendance Alerts
          </Button>
          <Button variant="outline" icon={Download} onClick={handleExportCSV}>
            CSV
          </Button>
          <Button variant="primary" icon={FileText} onClick={handleExportPDF}>
            PDF Report
          </Button>
        </div>
      </div>

      {/* Select Subject Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {subjects.map((sub) => (
          <button
            key={sub.subjectId}
            onClick={() => setSelectedSubjectId(sub.subjectId)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedSubjectId === sub.subjectId
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {sub.subjectCode} — {sub.subjectName}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Register Number</th>
                <th className="py-3 px-4">Total Classes</th>
                <th className="py-3 px-4">Present</th>
                <th className="py-3 px-4">Absent</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4 text-right">Risk Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {reportRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{row.studentName}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600">{row.registerNumber}</td>
                  <td className="py-3 px-4 font-mono">{row.totalClasses}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-600">{row.present}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-rose-600">{row.absent}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono font-black text-xs ${
                        row.percentage < 75 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {row.percentage}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge
                      variant={
                        row.percentage < 75
                          ? 'danger'
                          : row.percentage < 80
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {row.statusRisk}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
