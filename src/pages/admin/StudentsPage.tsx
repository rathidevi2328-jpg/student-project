import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Power,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  GraduationCap,
  Percent,
} from 'lucide-react';
import { Student, Department, AttendanceRecord } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { calculateAttendanceStats } from '../../utils/attendanceCalculator';
import { Card, Button, Input, Select, Badge, Modal } from '../../components/common/UIComponents';

export const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Profile View Modal
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Form inputs
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    email: '',
    phone: '',
    departmentId: '',
    course: 'B.Tech Computer Science',
    year: 3,
    section: 'A',
  });

  const loadData = async () => {
    const [sts, depts, atts] = await Promise.all([
      dataService.getStudents(),
      dataService.getDepartments(),
      dataService.getAttendanceRecords(),
    ]);
    setStudents(sts);
    setDepartments(depts);
    setAttendance(atts);
    if (depts.length > 0 && !formData.departmentId) {
      setFormData((prev) => ({ ...prev, departmentId: depts[0].departmentId }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      registerNumber: `REG2024CS${Math.floor(100 + Math.random() * 900)}`,
      email: '',
      phone: '+91 ',
      departmentId: departments[0]?.departmentId || 'dept-cse',
      course: 'B.Tech Computer Science',
      year: 3,
      section: 'A',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      registerNumber: student.registerNumber,
      email: student.email,
      phone: student.phone,
      departmentId: student.departmentId,
      course: student.course,
      year: student.year,
      section: student.section,
    });
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.registerNumber.trim()) {
      showToast('error', 'Validation Error', 'Please fill in all required student details.');
      return;
    }

    const deptObj = departments.find((d) => d.departmentId === formData.departmentId);

    if (editingStudent) {
      // Update
      const updated: Student = {
        ...editingStudent,
        ...formData,
        department: deptObj?.departmentName || 'Computer Science',
      };
      await dataService.saveStudent(updated);
      await dataService.logAction({
        userId: user?.uid || 'admin',
        userName: user?.name || 'Admin',
        role: 'admin',
        action: `Updated Student Record: ${updated.name}`,
        metadata: { studentId: updated.studentId, regNo: updated.registerNumber },
      });
      showToast('success', 'Student Updated', `${updated.name} has been updated.`);
    } else {
      // Create new
      const newStudent: Student = {
        studentId: `student-${Date.now()}`,
        ...formData,
        department: deptObj?.departmentName || 'Computer Science',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await dataService.saveStudent(newStudent);
      await dataService.logAction({
        userId: user?.uid || 'admin',
        userName: user?.name || 'Admin',
        role: 'admin',
        action: `Enrolled New Student: ${newStudent.name}`,
        metadata: { studentId: newStudent.studentId, regNo: newStudent.registerNumber },
      });
      showToast('success', 'Student Enrolled', `${newStudent.name} successfully registered.`);
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleToggleActive = async (student: Student) => {
    const newState = !student.isActive;
    await dataService.toggleStudentActive(student.studentId, newState);
    await dataService.logAction({
      userId: user?.uid || 'admin',
      userName: user?.name || 'Admin',
      role: 'admin',
      action: `${newState ? 'Reactivated' : 'Deactivated'} Student: ${student.name}`,
      metadata: { studentId: student.studentId },
    });
    showToast(
      'info',
      newState ? 'Student Activated' : 'Student Deactivated',
      `${student.name} status changed.`
    );
    loadData();
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDept = deptFilter === 'ALL' || s.departmentId === deptFilter;
    const matchYear = yearFilter === 'ALL' || String(s.year) === yearFilter;
    const matchSection = sectionFilter === 'ALL' || s.section === sectionFilter;

    return matchSearch && matchDept && matchYear && matchSection;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Enroll, monitor, search, and manage student attendance records
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Enroll New Student
        </Button>
      </div>

      {/* Search & Filters Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, reg number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
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

          {/* Year Filter */}
          <div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Academic Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Student Records Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Register No</th>
                <th className="py-3 px-4">Department / Year</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Biometrics</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No students match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  // Calculate student attendance
                  const stAtts = attendance.filter((a) => a.studentId === st.studentId);
                  const p = stAtts.filter((a) => a.status === 'Present').length;
                  const ab = stAtts.filter((a) => a.status === 'Absent').length;
                  const stats = calculateAttendanceStats(p, ab, 0, 75);

                  return (
                    <tr key={st.studentId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {st.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{st.name}</p>
                            <p className="text-[11px] text-slate-400">{st.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {st.registerNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{st.department}</p>
                        <p className="text-[11px] text-slate-400">
                          Year {st.year} • Sec {st.section}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black font-mono text-xs ${
                              stats.isBelowThreshold ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {stats.percentage}%
                          </span>
                          {stats.isBelowThreshold && (
                            <Badge variant="danger" className="text-[9px] px-1.5 py-0">
                              Low
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {p}/{stats.totalConducted} classes
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {st.faceData ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle className="w-3 h-3" /> Enrolled
                          </Badge>
                        ) : (
                          <Badge variant="neutral">Not Enrolled</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {st.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingStudent(st)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="View Profile & Attendance"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(st)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(st)}
                            className={`p-1.5 rounded-lg transition-all ${
                              st.isActive
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={st.isActive ? 'Deactivate' : 'Reactivate'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Enroll / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student Record' : 'Enroll New Student'}
        subtitle="Ensure register numbers and academic email addresses are accurate"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              placeholder="e.g. Alex Rivera"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Register Number"
              placeholder="e.g. REG2023CS042"
              value={formData.registerNumber}
              onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="College Email"
              type="email"
              placeholder="student@smartattend.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Department"
              options={departments.map((d) => ({ label: d.departmentName, value: d.departmentId }))}
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            />
            <Select
              label="Year"
              options={[
                { label: '1st Year', value: 1 },
                { label: '2nd Year', value: 2 },
                { label: '3rd Year', value: 3 },
                { label: '4th Year', value: 4 },
              ]}
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
            />
            <Select
              label="Section"
              options={[
                { label: 'Section A', value: 'A' },
                { label: 'Section B', value: 'B' },
                { label: 'Section C', value: 'C' },
              ]}
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingStudent ? 'Save Changes' : 'Enroll Student'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Student Profile & Attendance Detail Modal */}
      {viewingStudent && (
        <Modal
          isOpen={Boolean(viewingStudent)}
          onClose={() => setViewingStudent(null)}
          title={`Student Profile: ${viewingStudent.name}`}
          subtitle={`Register Number: ${viewingStudent.registerNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center">
                {viewingStudent.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">{viewingStudent.name}</h4>
                <p className="text-xs text-slate-500">{viewingStudent.email} • {viewingStudent.phone}</p>
                <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                  {viewingStudent.course} — Year {viewingStudent.year}, Section {viewingStudent.section}
                </p>
              </div>
            </div>

            {/* Attendance History for this Student */}
            <div>
              <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                Recent Attendance Logs
              </h5>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {attendance.filter((a) => a.studentId === viewingStudent.studentId).length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">No attendance records yet.</p>
                ) : (
                  attendance
                    .filter((a) => a.studentId === viewingStudent.studentId)
                    .slice(0, 10)
                    .map((rec) => (
                      <div key={rec.attendanceId} className="p-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">{rec.subjectName}</p>
                          <p className="text-[11px] text-slate-400">
                            {rec.date} • {rec.period} • Method: {rec.verificationMethod}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            rec.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'Absent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setViewingStudent(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
