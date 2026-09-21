import React, { useState, useEffect } from 'react';
import { UserCheck, QrCode } from 'lucide-react';
import { Subject, CollegeClass } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card } from '../../components/common/UIComponents';
import { ManualAttendanceModal } from '../../components/attendance/ManualAttendanceModal';
import { QRSessionModal } from '../../components/qr/QRSessionModal';

export const FacultyAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<CollegeClass[]>([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const facId = user?.facultyId || 'faculty-1';
      const [subs, cls] = await Promise.all([
        dataService.getSubjectsByFaculty(facId),
        dataService.getClasses(),
      ]);
      if (subs.length === 0) {
        const all = await dataService.getSubjects();
        setSubjects(all.slice(0, 3));
      } else {
        setSubjects(subs);
      }
      setClasses(cls);
    };
    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manual Attendance Roster</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Mark, override, or finalize student attendance for classroom lectures and practical sessions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon={UserCheck}
            onClick={() => setIsManualModalOpen(true)}
          >
            Launch Attendance Sheet
          </Button>
          <Button
            variant="outline"
            icon={QrCode}
            onClick={() => setIsQRModalOpen(true)}
          >
            Switch to QR Mode
          </Button>
        </div>
      </div>

      <Card className="text-center py-12 px-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 mx-auto flex items-center justify-center mb-4">
          <UserCheck className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Interactive Attendance Sheet Ready</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
          Select your course module, date, and period slot. You can rapidly use the "Mark All Present" button and toggle individual absentees or late arrivals.
        </p>
        <Button
          variant="primary"
          size="lg"
          icon={UserCheck}
          onClick={() => setIsManualModalOpen(true)}
          className="shadow-md shadow-indigo-200"
        >
          Open Roll Call Sheet
        </Button>
      </Card>

      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        subjects={subjects}
        classes={classes}
      />

      <QRSessionModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        subjects={subjects}
        classes={classes}
      />
    </div>
  );
};
