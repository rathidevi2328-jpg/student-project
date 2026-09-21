import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Layers, BookOpen, Users } from 'lucide-react';
import { Department, Student, Faculty, Subject } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card, Button, Input, Modal } from '../../components/common/UIComponents';

export const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    departmentName: '',
    departmentCode: '',
  });

  const loadData = async () => {
    const [d, st, f, sub] = await Promise.all([
      dataService.getDepartments(),
      dataService.getStudents(),
      dataService.getFaculty(),
      dataService.getSubjects(),
    ]);
    setDepartments(d);
    setStudents(st);
    setFaculty(f);
    setSubjects(sub);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({ departmentName: '', departmentCode: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Department) => {
    setEditingDept(d);
    setFormData({ departmentName: d.departmentName, departmentCode: d.departmentCode });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentName.trim() || !formData.departmentCode.trim()) {
      showToast('error', 'Validation Error', 'Please enter department name and code.');
      return;
    }

    const deptId = editingDept ? editingDept.departmentId : `dept-${formData.departmentCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const newDept: Department = {
      departmentId: deptId,
      departmentName: formData.departmentName.trim(),
      departmentCode: formData.departmentCode.trim().toUpperCase(),
      createdAt: editingDept ? editingDept.createdAt : new Date().toISOString(),
    };

    await dataService.saveDepartment(newDept);
    await dataService.logAction({
      userId: user?.uid || 'admin',
      userName: user?.name || 'Admin',
      role: 'admin',
      action: `${editingDept ? 'Updated' : 'Created'} Department: ${newDept.departmentName}`,
      metadata: { departmentCode: newDept.departmentCode },
    });

    showToast('success', 'Department Saved', `${newDept.departmentName} (${newDept.departmentCode}) saved.`);
    setIsModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Department Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure academic branches, schools, and faculties in the institution
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Add Custom Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map((dept) => {
          const deptStudents = students.filter((s) => s.departmentId === dept.departmentId && s.isActive);
          const deptFaculty = faculty.filter((f) => f.departmentId === dept.departmentId && f.isActive);
          const deptSubjects = subjects.filter((s) => s.departmentId === dept.departmentId);

          return (
            <Card key={dept.departmentId} className="hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center text-xs">
                  {dept.departmentCode}
                </div>
                <button
                  onClick={() => handleOpenEdit(dept)}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg"
                  title="Edit Department"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-sm text-slate-900 leading-snug">{dept.departmentName}</h3>
                <p className="text-xs font-mono font-semibold text-indigo-600 mt-0.5">{dept.departmentCode}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-slate-400">Students</p>
                  <p className="font-bold text-slate-800 mt-0.5">{deptStudents.length}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-slate-400">Faculty</p>
                  <p className="font-bold text-slate-800 mt-0.5">{deptFaculty.length}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-slate-400">Subjects</p>
                  <p className="font-bold text-slate-800 mt-0.5">{deptSubjects.length}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Add Custom Department'}
        subtitle="Specify academic name and formal code (e.g. Civil Engineering - CIVIL)"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Department Name"
            placeholder="e.g. Civil Engineering"
            value={formData.departmentName}
            onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
            required
          />
          <Input
            label="Department Code"
            placeholder="e.g. CIVIL"
            value={formData.departmentCode}
            onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
