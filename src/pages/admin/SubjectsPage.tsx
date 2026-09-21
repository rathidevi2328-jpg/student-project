import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, User, Layers } from 'lucide-react';
import { Subject, Department, Faculty, CollegeClass } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card, Button, Input, Select, Modal } from '../../components/common/UIComponents';

export const SubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [classes, setClasses] = useState<CollegeClass[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subject | null>(null);

  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    departmentId: '',
    semester: 5,
    year: 3,
    facultyId: '',
    classId: '',
  });

  const loadData = async () => {
    const [subs, depts, facs, cls] = await Promise.all([
      dataService.getSubjects(),
      dataService.getDepartments(),
      dataService.getFaculty(),
      dataService.getClasses(),
    ]);
    setSubjects(subs);
    setDepartments(depts);
    setFaculty(facs);
    setClasses(cls);

    if (depts.length && !formData.departmentId) {
      setFormData((prev) => ({
        ...prev,
        departmentId: depts[0].departmentId,
        facultyId: facs[0]?.facultyId || '',
        classId: cls[0]?.classId || '',
      }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingSub(null);
    setFormData({
      subjectCode: '',
      subjectName: '',
      departmentId: departments[0]?.departmentId || 'dept-cse',
      semester: 5,
      year: 3,
      facultyId: faculty[0]?.facultyId || '',
      classId: classes[0]?.classId || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSub(sub);
    setFormData({
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      departmentId: sub.departmentId,
      semester: sub.semester,
      year: sub.year,
      facultyId: sub.facultyId,
      classId: sub.classId,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectCode.trim() || !formData.subjectName.trim()) {
      showToast('error', 'Validation Error', 'Please specify subject code and title.');
      return;
    }

    const subId = editingSub ? editingSub.subjectId : `sub-${formData.subjectCode.toLowerCase()}-${Date.now()}`;
    const newSubject: Subject = {
      subjectId: subId,
      ...formData,
      subjectCode: formData.subjectCode.trim().toUpperCase(),
      subjectName: formData.subjectName.trim(),
      createdAt: editingSub ? editingSub.createdAt : new Date().toISOString(),
    };

    await dataService.saveSubject(newSubject);
    await dataService.logAction({
      userId: user?.uid || 'admin',
      userName: user?.name || 'Admin',
      role: 'admin',
      action: `${editingSub ? 'Updated' : 'Created'} Subject: ${newSubject.subjectName}`,
      metadata: { code: newSubject.subjectCode, facultyId: newSubject.facultyId },
    });

    showToast('success', 'Subject Saved', `${newSubject.subjectCode} - ${newSubject.subjectName} updated.`);
    setIsModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subject Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure curriculum courses, assign faculty instructors, and link target class sections
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Add Course Subject
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub) => {
          const dept = departments.find((d) => d.departmentId === sub.departmentId);
          const fac = faculty.find((f) => f.facultyId === sub.facultyId);
          const cls = classes.find((c) => c.classId === sub.classId);

          return (
            <Card key={sub.subjectId} className="hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <span className="px-2.5 py-1 rounded-xl text-xs font-black font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {sub.subjectCode}
                </span>
                <button
                  onClick={() => handleOpenEdit(sub)}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg"
                  title="Edit Subject"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-sm text-slate-900 leading-snug">{sub.subjectName}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{dept?.departmentName}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Assigned Faculty:
                  </span>
                  <span className="font-semibold text-slate-800">{fac?.name || 'Unassigned'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Class & Year:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {cls?.className || 'CSE-A'} (Sem {sub.semester})
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSub ? 'Edit Subject' : 'Add Course Subject'}
        subtitle="Ensure subject code and faculty allocation are accurate"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Subject Code"
              placeholder="e.g. CS501"
              value={formData.subjectCode}
              onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
              required
            />
            <Input
              label="Subject Title"
              placeholder="e.g. Database Management Systems"
              value={formData.subjectName}
              onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
              required
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
              label="Assigned Faculty"
              options={faculty.map((f) => ({ label: `${f.name} (${f.designation})`, value: f.facultyId }))}
              value={formData.facultyId}
              onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Linked Class"
              options={classes.map((c) => ({ label: c.className, value: c.classId }))}
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            />

            <Select
              label="Academic Year"
              options={[
                { label: 'Year 1', value: 1 },
                { label: 'Year 2', value: 2 },
                { label: 'Year 3', value: 3 },
                { label: 'Year 4', value: 4 },
              ]}
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
            />

            <Select
              label="Semester"
              options={[
                { label: 'Semester 1', value: 1 },
                { label: 'Semester 2', value: 2 },
                { label: 'Semester 3', value: 3 },
                { label: 'Semester 4', value: 4 },
                { label: 'Semester 5', value: 5 },
                { label: 'Semester 6', value: 6 },
                { label: 'Semester 7', value: 7 },
                { label: 'Semester 8', value: 8 },
              ]}
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingSub ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
