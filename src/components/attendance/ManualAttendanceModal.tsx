import React, { useState, useEffect } from 'react';
import { Check, X, Clock, CheckCheck, Save, AlertCircle } from 'lucide-react';
import { Subject, CollegeClass, Student, AttendanceStatus, AttendanceRecord } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button, Select, Input, Modal } from '../common/UIComponents';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  classes: CollegeClass[];
  preselectedSubjectId?: string;
  onSaved?: () => void;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  subjects,
  classes,
  preselectedSubjectId,
  onSaved,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [selectedSubjectId, setSelectedSubjectId] = useState(preselectedSubjectId || subjects[0]?.subjectId || '');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.classId || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState('Period 1 (09:00 - 10:00)');

  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (preselectedSubjectId) {
      setSelectedSubjectId(preselectedSubjectId);
      const sub = subjects.find((s) => s.subjectId === preselectedSubjectId);
      if (sub?.classId) setSelectedClassId(sub.classId);
    }
  }, [preselectedSubjectId, subjects]);

  // Load students for selected class
  useEffect(() => {
    const fetchStudents = async () => {
      const allStudents = await dataService.getStudents();
      // Filter active students belonging to selected class or default to all active
      const classObj = classes.find((c) => c.classId === selectedClassId);
      let filtered = allStudents.filter((s) => s.isActive);
      if (classObj && classObj.studentIds.length > 0) {
        filtered = filtered.filter((s) => classObj.studentIds.includes(s.studentId));
      }
      setStudents(filtered);

      // Initialize all to Present by default or fetch existing records
      const initialMap: Record<string, AttendanceStatus> = {};
      filtered.forEach((st) => {
        initialMap[st.studentId] = 'Present';
      });
      setAttendanceMap(initialMap);
    };

    if (isOpen) {
      fetchStudents();
    }
  }, [selectedClassId, isOpen, classes]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((st) => {
      updated[st.studentId] = 'Present';
    });
    setAttendanceMap(updated);
    showToast('info', 'Batch Updated', 'Marked all students as Present.');
  };

  const handleMarkAllAbsent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((st) => {
      updated[st.studentId] = 'Absent';
    });
    setAttendanceMap(updated);
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'Absent').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'Late').length;

  const handleConfirmSave = async () => {
    setIsSaving(true);
    const subject = subjects.find((s) => s.subjectId === selectedSubjectId);

    try {
      const recordsToSave: AttendanceRecord[] = students.map((st) => {
        const status = attendanceMap[st.studentId] || 'Present';
        return {
          attendanceId: `att-man-${st.studentId}-${date}-${period.slice(0, 8)}`,
          studentId: st.studentId,
          studentName: st.name,
          registerNumber: st.registerNumber,
          subjectId: selectedSubjectId,
          subjectName: subject?.subjectName || 'Course Subject',
          classId: selectedClassId,
          facultyId: user?.facultyId || user?.uid || 'faculty-1',
          date,
          period,
          timestamp: `${date}T${new Date().toISOString().slice(11)}`,
          status,
          verificationMethod: 'manual',
          locationVerified: true,
          faceVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      await dataService.batchSaveAttendance(recordsToSave);

      await dataService.logAction({
        userId: user?.uid || 'faculty-1',
        userName: user?.name || 'Faculty',
        role: 'faculty',
        action: 'Saved Manual Attendance',
        metadata: {
          subjectName: subject?.subjectName,
          date,
          period,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
        },
      });

      showToast(
        'success',
        'Attendance Saved',
        `Recorded for ${students.length} students (${presentCount} Present, ${absentCount} Absent)`
      );

      setShowConfirmModal(false);
      onClose();
      if (onSaved) onSaved();
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message || 'Could not save attendance records.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showConfirmModal}
        onClose={onClose}
        title="Manual Attendance Marking"
        subtitle="Mark classroom attendance manually with individual status overrides"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Top selection controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <Select
              label="Subject"
              options={subjects.map((s) => ({ label: `${s.subjectCode} - ${s.subjectName}`, value: s.subjectId }))}
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            />

            <Select
              label="Class"
              options={classes.map((c) => ({ label: `${c.className} (${c.academicYear})`, value: c.classId }))}
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            />

            <Input
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <Select
              label="Period / Time Slot"
              options={[
                { label: 'Period 1 (09:00 - 10:00 AM)', value: 'Period 1 (09:00 - 10:00)' },
                { label: 'Period 2 (10:15 - 11:15 AM)', value: 'Period 2 (10:15 - 11:15)' },
                { label: 'Period 3 (11:30 - 12:30 PM)', value: 'Period 3 (11:30 - 12:30)' },
                { label: 'Period 4 (01:30 - 02:30 PM)', value: 'Period 4 (01:30 - 02:30)' },
                { label: 'Period 5 (02:45 - 03:45 PM)', value: 'Period 5 (02:45 - 03:45)' },
              ]}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>

          {/* Quick Action Bar & Summary Counters */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={CheckCheck}
                onClick={handleMarkAllPresent}
                className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
              >
                Mark All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAbsent}
                className="text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
              >
                Mark All Absent
              </Button>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-emerald-600">Present: {presentCount}</span>
              <span className="text-rose-600">Absent: {absentCount}</span>
              <span className="text-amber-600">Late: {lateCount}</span>
            </div>
          </div>

          {/* Student Roll List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 pr-1">
            {students.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No active students found in this class.</p>
            ) : (
              students.map((student, idx) => {
                const currentStatus = attendanceMap[student.studentId] || 'Present';
                return (
                  <div
                    key={student.studentId}
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400 w-5">{idx + 1}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{student.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{student.registerNumber}</p>
                      </div>
                    </div>

                    {/* Status Pill Switcher */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.studentId, 'Present')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          currentStatus === 'Present'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Present</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.studentId, 'Absent')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          currentStatus === 'Absent'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.studentId, 'Late')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          currentStatus === 'Late'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Late</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-400">Total: {students.length} students enrolled</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Save}
                onClick={() => setShowConfirmModal(true)}
                disabled={students.length === 0}
              >
                Review & Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal (Section 11 requirement) */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Attendance Submission"
        subtitle="Please verify the attendance summary before saving to the official database"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Important Confirmation</p>
              <p>
                You are about to finalize attendance for <strong>{date}</strong> ({period}).
                This will update student attendance percentages and trigger low-attendance warnings if applicable.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Enrolled:</span>
              <span className="font-bold text-slate-800">{students.length}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Present:</span>
              <span>{presentCount}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-semibold">
              <span>Absent:</span>
              <span>{absentCount}</span>
            </div>
            <div className="flex justify-between text-amber-600 font-semibold">
              <span>Late:</span>
              <span>{lateCount}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isSaving}>
              Back to Edit
            </Button>
            <Button variant="primary" onClick={handleConfirmSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Confirm & Save Attendance'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
