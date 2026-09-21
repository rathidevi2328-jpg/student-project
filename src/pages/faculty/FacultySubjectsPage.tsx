import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Percent, QrCode, UserCheck, AlertTriangle } from 'lucide-react';
import { Subject, CollegeClass, Student, AttendanceRecord } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { calculateAttendanceStats } from '../../utils/attendanceCalculator';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import { QRSessionModal } from '../../components/qr/QRSessionModal';
import { ManualAttendanceModal } from '../../components/attendance/ManualAttendanceModal';

export const FacultySubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<CollegeClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const facId = user?.facultyId || 'faculty-1';
      const [subs, cls, sts, atts] = await Promise.all([
        dataService.getSubjectsByFaculty(facId),
        dataService.getClasses(),
        dataService.getStudents(),
        dataService.getAttendanceRecords(),
      ]);

      if (subs.length === 0) {
        const allSubs = await dataService.getSubjects();
        setSubjects(allSubs.slice(0, 3));
        setSelectedSubject(allSubs[0] || null);
      } else {
        setSubjects(subs);
        setSelectedSubject(subs[0] || null);
      }

      setClasses(cls);
      setStudents(sts.filter((s) => s.isActive));
      setAttendance(atts);
    };
    load();
  }, [user]);

  if (!selectedSubject) return null;

  // Compute student stats for selected subject
  const subAttendance = attendance.filter((a) => a.subjectId === selectedSubject.subjectId);
  const studentRows = students.map((st) => {
    const stAtts = subAttendance.filter((a) => a.studentId === st.studentId);
    const p = stAtts.filter((a) => a.status === 'Present').length;
    const ab = stAtts.filter((a) => a.status === 'Absent').length;
    const l = stAtts.filter((a) => a.status === 'Late').length;
    const stats = calculateAttendanceStats(p, ab, l, 75);
    return {
      student: st,
      stats,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Subjects</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Subject-level attendance analytics, student roster, and session launchers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon={QrCode}
            onClick={() => setIsQRModalOpen(true)}
          >
            Launch QR Session
          </Button>
          <Button
            variant="outline"
            icon={UserCheck}
            onClick={() => setIsManualModalOpen(true)}
          >
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Subject Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {subjects.map((sub) => (
          <button
            key={sub.subjectId}
            onClick={() => setSelectedSubject(sub)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedSubject.subjectId === sub.subjectId
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {sub.subjectCode} — {sub.subjectName}
          </button>
        ))}
      </div>

      {/* Selected Subject Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                {selectedSubject.subjectCode}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{selectedSubject.subjectName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Class: {selectedSubject.classId.toUpperCase()} • Semester {selectedSubject.semester}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Total Enrolled</span>
              <p className="text-2xl font-black text-slate-900 font-mono">{students.length}</p>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-center items-center text-center">
          <span className="text-xs font-semibold text-slate-400">Below 75% Threshold</span>
          <p className="text-3xl font-black text-rose-600 mt-1 font-mono">
            {studentRows.filter((r) => r.stats.isBelowThreshold).length}
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5">Students At Risk</span>
        </Card>
      </div>

      {/* Student Attendance Roster for this Subject */}
      <Card
        title="Enrolled Student Attendance Roster"
        subtitle="Individual student attendance percentage, conducted sessions, and risk evaluation"
        className="overflow-hidden p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Register Number</th>
                <th className="py-3 px-4">Classes Conducted</th>
                <th className="py-3 px-4">Present</th>
                <th className="py-3 px-4">Absent</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Status Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {studentRows.map(({ student, stats }) => (
                <tr key={student.studentId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{student.name}</p>
                    <p className="text-[11px] text-slate-400">{student.email}</p>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                    {student.registerNumber}
                  </td>
                  <td className="py-3 px-4 font-mono">{stats.totalConducted}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-600">{stats.presentCount}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-rose-600">{stats.absentCount}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono font-black text-xs ${
                        stats.isBelowThreshold ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {stats.percentage}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        stats.isBelowThreshold
                          ? 'danger'
                          : stats.statusRisk === 'Medium Risk'
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {stats.statusRisk}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <QRSessionModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        subjects={subjects}
        classes={classes}
        preselectedSubjectId={selectedSubject.subjectId}
      />

      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        subjects={subjects}
        classes={classes}
        preselectedSubjectId={selectedSubject.subjectId}
      />
    </div>
  );
};
