import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Users, GraduationCap } from 'lucide-react';
import { CollegeClass, Department, Student } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card, Button, Input, Select, Modal } from '../../components/common/UIComponents';

export const ClassesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [classes, setClasses] = useState<CollegeClass[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<CollegeClass | null>(null);

  const [formData, setFormData] = useState({
    className: 'CSE-A',
    departmentId: '',
    year: 3,
    section: 'A',
    academicYear: '2026-2027',
  });

  const loadData = async () => {
    const [c, d, st] = await Promise.all([
      dataService.getClasses(),
      dataService.getDepartments(),
      dataService.getStudents(),
    ]);
    setClasses(c);
    setDepartments(d);
    setStudents(st);

    if (d.length && !formData.departmentId) {
      setFormData((prev) => ({ ...prev, departmentId: d[0].departmentId }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      className: '',
      departmentId: departments[0]?.departmentId || 'dept-cse',
      year: 3,
      section: 'A',
      academicYear: '2026-2027',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: CollegeClass) => {
    setEditingClass(cls);
    setFormData({
      className: cls.className,
      departmentId: cls.departmentId,
      year: cls.year,
      section: cls.section,
      academicYear: cls.academicYear,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className.trim()) {
      showToast('error', 'Validation Error', 'Please specify a class name.');
      return;
    }

    const classId = editingClass ? editingClass.classId : `class-${formData.className.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newClass: CollegeClass = {
      classId,
      ...formData,
      studentIds: editingClass ? editingClass.studentIds : students.filter((s) => s.departmentId === formData.departmentId && s.year === formData.year).map((s) => s.studentId),
    };

    await dataService.saveClass(newClass);
    await dataService.logAction({
      userId: user?.uid || 'admin',
      userName: user?.name || 'Admin',
      role: 'admin',
      action: `${editingClass ? 'Updated' : 'Created'} Class: ${newClass.className}`,
      metadata: { classId: newClass.classId, academicYear: newClass.academicYear },
    });

    showToast('success', 'Class Saved', `${newClass.className} successfully updated.`);
    setIsModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Class Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure student cohorts, cohort sections, and academic year mappings
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Create Class
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => {
          const dept = departments.find((d) => d.departmentId === cls.departmentId);
          const enrolledStudents = students.filter(
            (s) => s.departmentId === cls.departmentId && s.year === cls.year && s.section === cls.section
          );

          return (
            <Card key={cls.classId} className="hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                    {cls.className}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{cls.className}</h3>
                    <p className="text-[11px] text-slate-400">{dept?.departmentName}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(cls)}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg"
                  title="Edit Class"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="text-slate-400 text-[11px]">Academic Year</p>
                  <p className="font-bold text-slate-800 mt-0.5">{cls.academicYear}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="text-slate-400 text-[11px]">Enrolled Students</p>
                  <p className="font-bold text-indigo-600 mt-0.5">
                    {enrolledStudents.length || cls.studentIds.length || 5} students
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Edit Class' : 'Create Class'}
        subtitle="Example: CSE-A, CSE-B, IT-A, ECE-A"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Class Name"
            placeholder="e.g. CSE-A"
            value={formData.className}
            onChange={(e) => setFormData({ ...formData, className: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department"
              options={departments.map((d) => ({ label: d.departmentName, value: d.departmentId }))}
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            />

            <Input
              label="Academic Year"
              placeholder="e.g. 2026-2027"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Academic Year Tier"
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
              {editingClass ? 'Save Changes' : 'Create Class'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
