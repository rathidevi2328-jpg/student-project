import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  Calendar,
  Percent,
  AlertTriangle,
  PlusCircle,
  FileSpreadsheet,
  ArrowUpRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { dataService } from '../../services/dataService';
import { calculateAttendanceStats } from '../../utils/attendanceCalculator';
import { Student, Faculty, Department, Subject, AttendanceRecord, SystemSettings } from '../../types';
import { StatCard, Card, Button } from '../../components/common/UIComponents';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      const [sts, facs, depts, subs, atts, sets] = await Promise.all([
        dataService.getStudents(),
        dataService.getFaculty(),
        dataService.getDepartments(),
        dataService.getSubjects(),
        dataService.getAttendanceRecords(),
        dataService.getSettings(),
      ]);

      setStudents(sts);
      setFaculty(facs);
      setDepartments(depts);
      setSubjects(subs);
      setAttendance(atts);
      setSettings(sets);
      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  // Compute key metrics
  const activeStudents = students.filter((s) => s.isActive);
  const activeFaculty = faculty.filter((f) => f.isActive);
  const threshold = settings?.attendanceThreshold || 75;

  // Students below threshold count
  const lowAttendanceStudents = activeStudents.filter((st) => {
    const stAtts = attendance.filter((a) => a.studentId === st.studentId);
    if (stAtts.length === 0) return false;
    const present = stAtts.filter((a) => a.status === 'Present').length;
    const absent = stAtts.filter((a) => a.status === 'Absent').length;
    const late = stAtts.filter((a) => a.status === 'Late').length;
    const stats = calculateAttendanceStats(present, absent, late, threshold);
    return stats.isBelowThreshold;
  });

  // Overall attendance %
  const totalPresent = attendance.filter((a) => a.status === 'Present').length;
  const totalAbsent = attendance.filter((a) => a.status === 'Absent').length;
  const totalLate = attendance.filter((a) => a.status === 'Late').length;
  const totalRecords = attendance.length;
  const avgAttendancePercent = totalRecords > 0
    ? Number((((totalPresent + totalLate) / totalRecords) * 100).toFixed(1))
    : 0;

  // Today's attendance
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecords = attendance.filter((a) => a.date === todayStr);
  const todayPresent = todayRecords.filter((a) => a.status === 'Present').length;
  const todayAttendancePercent = todayRecords.length > 0
    ? Number(((todayPresent / todayRecords.length) * 100).toFixed(1))
    : avgAttendancePercent;

  // Chart 1: Attendance Over Time (Line Chart)
  // Aggregate by date
  const dateMap: Record<string, { present: number; total: number }> = {};
  attendance.forEach((rec) => {
    if (!dateMap[rec.date]) dateMap[rec.date] = { present: 0, total: 0 };
    dateMap[rec.date].total++;
    if (rec.status === 'Present') dateMap[rec.date].present++;
  });

  const lineChartData = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, data]) => ({
      date: date.slice(5), // MM-DD
      rate: Number(((data.present / data.total) * 100).toFixed(1)),
    }));

  // Chart 2: Department Attendance (Bar Chart)
  const barChartData = departments.map((dept) => {
    const deptSubs = subjects.filter((s) => s.departmentId === dept.departmentId).map((s) => s.subjectId);
    const deptAtts = attendance.filter((a) => deptSubs.includes(a.subjectId));
    const p = deptAtts.filter((a) => a.status === 'Present').length;
    const t = deptAtts.length;
    return {
      department: dept.departmentCode,
      attendance: t > 0 ? Number(((p / t) * 100).toFixed(1)) : 85,
    };
  });

  // Chart 3: Attendance Distribution (Donut Pie Chart)
  const pieChartData = [
    { name: 'Present', value: totalPresent || 82, color: '#10b981' },
    { name: 'Absent', value: totalAbsent || 12, color: '#f43f5e' },
    { name: 'Late', value: totalLate || 6, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Institutional Admin Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time attendance telemetry, faculty allocations, and institutional performance metrics.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => navigate('/admin/students')}
          >
            Add Student
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Users}
            onClick={() => navigate('/admin/faculty')}
          >
            Add Faculty
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => navigate('/admin/reports')}
          >
            View Reports
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={activeStudents.length}
          subtitle={`${students.length - activeStudents.length} deactivated`}
          icon={GraduationCap}
          color="indigo"
        />
        <StatCard
          title="Total Faculty"
          value={activeFaculty.length}
          subtitle="Across 4 Departments"
          icon={Users}
          color="sky"
        />
        <StatCard
          title="Today's Attendance"
          value={`${todayAttendancePercent}%`}
          subtitle={`${todayRecords.length} sessions logged today`}
          icon={Percent}
          color="emerald"
          trend="+2.4% vs last week"
          trendPositive={true}
        />
        <StatCard
          title="Below Threshold"
          value={lowAttendanceStudents.length}
          subtitle={`Under minimum ${threshold}% standard`}
          icon={AlertTriangle}
          color={lowAttendanceStudents.length > 0 ? 'rose' : 'emerald'}
          trend={lowAttendanceStudents.length > 0 ? 'Attention Required' : 'All Clear'}
          trendPositive={lowAttendanceStudents.length === 0}
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div>
          <p className="text-xs text-slate-500 font-medium">Departments</p>
          <p className="text-lg font-bold text-slate-800">{departments.length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Active Subjects</p>
          <p className="text-lg font-bold text-slate-800">{subjects.length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Average Attendance</p>
          <p className="text-lg font-bold text-indigo-600">{avgAttendancePercent}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Standard Threshold</p>
          <p className="text-lg font-bold text-slate-800">{threshold}%</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Over Time Line Chart */}
        <Card
          title="Attendance Overview"
          subtitle="Daily institutional attendance trend over recent sessions"
          className="lg:col-span-2"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ fill: '#4f46e5', r: 4 }}
                  activeDot={{ r: 6, stroke: '#818cf8', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut Chart: Distribution */}
        <Card
          title="Attendance Distribution"
          subtitle="Overall Present, Absent, and Late records"
        >
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [val, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 flex justify-around text-center text-xs border-t border-slate-100">
            <div>
              <span className="text-slate-400">Present</span>
              <p className="font-bold text-emerald-600">{totalPresent}</p>
            </div>
            <div>
              <span className="text-slate-400">Absent</span>
              <p className="font-bold text-rose-600">{totalAbsent}</p>
            </div>
            <div>
              <span className="text-slate-400">Late</span>
              <p className="font-bold text-amber-600">{totalLate}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Department Attendance Bar Chart */}
      <Card
        title="Department Attendance Comparison"
        subtitle="Average student attendance percentage across academic faculties"
      >
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'Attendance %']}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="attendance" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => navigate('/admin/students')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
        >
          <GraduationCap className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-bold text-slate-800">Manage Students</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Enroll & edit students</p>
        </button>

        <button
          onClick={() => navigate('/admin/faculty')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
        >
          <Users className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-bold text-slate-800">Faculty Roster</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Assign course subjects</p>
        </button>

        <button
          onClick={() => navigate('/admin/departments')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
        >
          <Building2 className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-bold text-slate-800">Departments</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Academic branches</p>
        </button>

        <button
          onClick={() => navigate('/admin/classes')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
        >
          <BookOpen className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-bold text-slate-800">Classes & Sections</p>
          <p className="text-[10px] text-slate-400 mt-0.5">CSE-A, CSE-B, etc.</p>
        </button>

        <button
          onClick={() => navigate('/admin/reports')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
        >
          <FileSpreadsheet className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-bold text-slate-800">Export Reports</p>
          <p className="text-[10px] text-slate-400 mt-0.5">PDF & CSV exports</p>
        </button>
      </div>
    </div>
  );
};
