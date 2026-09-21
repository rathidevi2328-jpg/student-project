import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  QrCode,
  UserCheck,
  Clock,
  Users,
  Percent,
  Calendar,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Subject, CollegeClass, AttendanceRecord, AttendanceSession } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { calculateAttendanceStats } from '../../utils/attendanceCalculator';
import { StatCard, Card, Button } from '../../components/common/UIComponents';
import { QRSessionModal } from '../../components/qr/QRSessionModal';
import { ManualAttendanceModal } from '../../components/attendance/ManualAttendanceModal';

export const FacultyDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [assignedSubjects, setAssignedSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<CollegeClass[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Modals
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [activeSubjectForModal, setActiveSubjectForModal] = useState<string>('');

  const loadData = async () => {
    const facId = user?.facultyId || 'faculty-1';
    const [subs, cls, atts] = await Promise.all([
      dataService.getSubjectsByFaculty(facId),
      dataService.getClasses(),
      dataService.getAttendanceRecords(),
    ]);

    // If no subjects specifically mapped, show CS subjects for demo
    if (subs.length === 0) {
      const allSubs = await dataService.getSubjects();
      setAssignedSubjects(allSubs.slice(0, 3));
    } else {
      setAssignedSubjects(subs);
    }

    setClasses(cls);
    setAttendance(atts);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Overall average attendance for faculty's subjects
  const facultySubIds = assignedSubjects.map((s) => s.subjectId);
  const facultyAtts = attendance.filter((a) => facultySubIds.includes(a.subjectId));
  const p = facultyAtts.filter((a) => a.status === 'Present').length;
  const l = facultyAtts.filter((a) => a.status === 'Late').length;
  const avgAttendance = facultyAtts.length > 0
    ? Number((((p + l) / facultyAtts.length) * 100).toFixed(1))
    : 87.4;

  const todaySchedule = [
    { time: '09:00 - 10:00 AM', period: 'Period 1', code: 'CS501', title: 'Database Management Systems', class: 'CSE-A', room: 'LH-301' },
    { time: '10:15 - 11:15 AM', period: 'Period 2', code: 'CS502', title: 'Computer Networks', class: 'CSE-A', room: 'LH-301' },
    { time: '01:30 - 02:30 PM', period: 'Period 4', code: 'CS504', title: 'Java Enterprise Systems', class: 'CSE-A', room: 'Lab-2' },
    { time: '02:45 - 03:45 PM', period: 'Period 5', code: 'CS501', title: 'DBMS Practical Lab', class: 'CSE-A', room: 'Lab-1' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Welcome, {user?.name || 'Dr. Rajesh Sharma'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Faculty Teaching Portal • Manage course attendance, launch dynamic QR sessions, and view student risk metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon={QrCode}
            onClick={() => {
              setActiveSubjectForModal(assignedSubjects[0]?.subjectId || '');
              setIsQRModalOpen(true);
            }}
          >
            Start QR Attendance
          </Button>
          <Button
            variant="outline"
            icon={UserCheck}
            onClick={() => {
              setActiveSubjectForModal(assignedSubjects[0]?.subjectId || '');
              setIsManualModalOpen(true);
            }}
          >
            Manual Entry
          </Button>
        </div>
      </div>

      {/* Faculty KPI Metrics (Section 22 requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Today's Classes"
          value="4"
          subtitle="Scheduled across academic periods"
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Attendance Sessions"
          value={facultyAtts.length > 0 ? String(Math.ceil(facultyAtts.length / 5)) : '3'}
          subtitle="Active & recorded this term"
          icon={QrCode}
          color="sky"
        />
        <StatCard
          title="Average Attendance"
          value={`${avgAttendance}%`}
          subtitle="Above institutional 75% standard"
          icon={Percent}
          color="emerald"
          trend="+1.8% this week"
          trendPositive={true}
        />
      </div>

      {/* Today's Schedule Timeline (Section 22 requirement) */}
      <Card
        title="Today's Academic Schedule"
        subtitle="Live class timeline for Monday, 21 September 2026"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {todaySchedule.map((cls, idx) => (
            <div
              key={idx}
              className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-200 transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {cls.period}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">{cls.time}</span>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{cls.title}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {cls.code} • {cls.class} • Room {cls.room}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Assigned Subjects Cards (Section 22 requirement: Start Attendance / View Attendance) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">Assigned Course Modules</h2>
          <span className="text-xs text-slate-400">{assignedSubjects.length} subjects active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedSubjects.map((sub) => {
            const subAtts = attendance.filter((a) => a.subjectId === sub.subjectId);
            const pCount = subAtts.filter((a) => a.status === 'Present').length;
            const tCount = subAtts.length;
            const rate = tCount > 0 ? Number(((pCount / tCount) * 100).toFixed(1)) : 88.5;

            return (
              <Card key={sub.subjectId} className="flex flex-col justify-between hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {sub.subjectCode}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">{rate}% avg</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mt-1">{sub.subjectName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Class: <span className="font-semibold text-slate-700">{sub.classId.toUpperCase()}</span> (Semester {sub.semester})
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={QrCode}
                    onClick={() => {
                      setActiveSubjectForModal(sub.subjectId);
                      setIsQRModalOpen(true);
                    }}
                  >
                    Start Attendance
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={UserCheck}
                    onClick={() => {
                      setActiveSubjectForModal(sub.subjectId);
                      setIsManualModalOpen(true);
                    }}
                  >
                    View / Mark
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Dynamic QR Session Modal */}
      <QRSessionModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        subjects={assignedSubjects}
        classes={classes}
        preselectedSubjectId={activeSubjectForModal}
        onSessionCreated={() => {
          loadData();
        }}
      />

      {/* Manual Attendance Modal */}
      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        subjects={assignedSubjects}
        classes={classes}
        preselectedSubjectId={activeSubjectForModal}
        onSaved={() => {
          loadData();
        }}
      />
    </div>
  );
};
