import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Power,
  BookOpen,
  Search,
  CheckCircle2,
  Briefcase,
  Phone,
  Mail,
} from 'lucide-react';
import { Faculty, Department, Subject, AttendanceSession } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card, Button, Input, Select, Badge, Modal } from '../../components/common/UIComponents';

export const FacultyPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

  // Assign Subject Modal
  const [assigningFaculty, setAssigningFaculty] = useState<Faculty | null>(null);
  const [selectedSubjectToAssign, setSelectedSubjectToAssign] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    designation: 'Assistant Professor',
  });

  const loadData = async () => {
    const [facs, depts, subs] = await Promise.all([
      dataService.getFaculty(),
      dataService.getDepartments(),
      dataService.getSubjects(),
    ]);
    setFacultyList(facs);
    setDepartments(depts);
    setSubjects(subs);
    if (depts.length > 0 && !formData.departmentId) {
      setFormData((prev) => ({ ...prev, departmentId: depts[0].departmentId }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingFaculty(null);
    setFormData({
      name: '',
      email: '',
      phone: '+91 98765 ',
      departmentId: departments[0]?.departmentId || 'dept-cse',
      designation: 'Assistant Professor',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fac: Faculty) => {
    setEditingFaculty(fac);
    setFormData({
      name: fac.name,
      email: fac.email,
      phone: fac.phone,
      departmentId: fac.departmentId,
      designation: fac.designation,
    });
    setIsModalOpen(true);
  };

  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('error', 'Validation Error', 'Please fill in name and email.');
      return;
    }

    const deptObj = departments.find((d) => d.departmentId === formData.departmentId);

    if (editingFaculty) {
      const updated: Faculty = {
        ...editingFaculty,
        ...formData,
        department: deptObj?.departmentName || 'Computer Science',
      };
      await dataService.saveFaculty(updated);
      await dataService.logAction({
        userId: user?.uid || 'admin',
        userName: user?.name || 'Admin',
        role: 'admin',
        action: `Updated Faculty Profile: ${updated.name}`,
        metadata: { facultyId: updated.facultyId },
      });
      showToast('success', 'Faculty Updated', `${updated.name} has been updated.`);
    } else {
      const newFaculty: Faculty = {
        facultyId: `faculty-${Date.now()}`,
        ...formData,
        department: deptObj?.departmentName || 'Computer Science',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await dataService.saveFaculty(newFaculty);
      await dataService.logAction({
        userId: user?.uid || 'admin',
        userName: user?.name || 'Admin',
        role: 'admin',
        action: `Registered New Faculty: ${newFaculty.name}`,
        metadata: { facultyId: newFaculty.facultyId },
      });
      showToast('success', 'Faculty Registered', `${newFaculty.name} successfully registered.`);
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleToggleActive = async (fac: Faculty) => {
    const newState = !fac.isActive;
    await dataService.toggleFacultyActive(fac.facultyId, newState);
    await dataService.logAction({
      userId: user?.uid || 'admin',
      userName: user?.name || 'Admin',
      role: 'admin',
      action: `${newState ? 'Reactivated' : 'Deactivated'} Faculty: ${fac.name}`,
      metadata: { facultyId: fac.facultyId },
    });
    showToast(
      'info',
      newState ? 'Faculty Activated' : 'Faculty Deactivated',
      `${fac.name} status updated.`
    );
    loadData();
  };

  const handleAssignSubject = async () => {
    if (!assigningFaculty || !selectedSubjectToAssign) return;
    const sub = subjects.find((s) => s.subjectId === selectedSubjectToAssign);
    if (sub) {
      const updatedSub: Subject = {
        ...sub,
        facultyId: assigningFaculty.facultyId,
      };
      await dataService.saveSubject(updatedSub);
      await dataService.logAction({
        userId: user?.uid || 'admin',
        userName: user?.name || 'Admin',
        role: 'admin',
        action: `Assigned Subject ${sub.subjectName} to ${assigningFaculty.name}`,
        metadata: { subjectId: sub.subjectId, facultyId: assigningFaculty.facultyId },
      });
      showToast('success', 'Subject Assigned', `${sub.subjectName} assigned to ${assigningFaculty.name}`);
      setAssigningFaculty(null);
      loadData();
    }
  };

  const filteredFaculty = facultyList.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter === 'ALL' || f.departmentId === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage academic professors, assign course subjects, and track attendance session activity
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Add Faculty Member
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by faculty name, email, or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

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
        </div>
      </Card>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFaculty.map((fac) => {
          const assignedSubs = subjects.filter((s) => s.facultyId === fac.facultyId);

          return (
            <div
              key={fac.facultyId}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
                !fac.isActive ? 'border-slate-200 opacity-70 bg-slate-50/50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm shadow-inner">
                    {fac.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{fac.name}</h3>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">{fac.designation}</p>
                    <p className="text-[11px] text-slate-400">{fac.department}</p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    fac.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {fac.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Contact info */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{fac.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{fac.phone || 'Not provided'}</span>
                </p>
              </div>

              {/* Assigned Subjects */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Assigned Subjects ({assignedSubs.length})
                  </span>
                  <button
                    onClick={() => {
                      setAssigningFaculty(fac);
                      setSelectedSubjectToAssign(subjects[0]?.subjectId || '');
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    + Assign
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                  {assignedSubs.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">No subjects assigned yet</span>
                  ) : (
                    assignedSubs.map((sub) => (
                      <span
                        key={sub.subjectId}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                        title={sub.subjectName}
                      >
                        {sub.subjectCode}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleOpenEdit(fac)}
                >
                  Edit Profile
                </Button>
                <button
                  onClick={() => handleToggleActive(fac)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                    fac.isActive
                      ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                      : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {fac.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaculty ? 'Edit Faculty Details' : 'Register Faculty Member'}
        subtitle="Manage professor credentials and department affiliation"
      >
        <form onSubmit={handleSaveFaculty} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Rajesh Sharma"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Academic Email"
              type="email"
              placeholder="faculty@smartattend.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Contact Phone"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department"
              options={departments.map((d) => ({ label: d.departmentName, value: d.departmentId }))}
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            />

            <Select
              label="Designation"
              options={[
                { label: 'Professor & HOD', value: 'Professor & HOD' },
                { label: 'Professor', value: 'Professor' },
                { label: 'Associate Professor', value: 'Associate Professor' },
                { label: 'Assistant Professor', value: 'Assistant Professor' },
                { label: 'Lecturer', value: 'Lecturer' },
              ]}
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingFaculty ? 'Save Changes' : 'Register Faculty'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Subject Modal */}
      {assigningFaculty && (
        <Modal
          isOpen={Boolean(assigningFaculty)}
          onClose={() => setAssigningFaculty(null)}
          title={`Assign Subject to ${assigningFaculty.name}`}
          subtitle="Select an existing course subject to link to this faculty member"
        >
          <div className="space-y-4">
            <Select
              label="Course Subject"
              options={subjects.map((s) => ({
                label: `${s.subjectCode} — ${s.subjectName}`,
                value: s.subjectId,
              }))}
              value={selectedSubjectToAssign}
              onChange={(e) => setSelectedSubjectToAssign(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setAssigningFaculty(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAssignSubject}>
                Confirm Subject Assignment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
