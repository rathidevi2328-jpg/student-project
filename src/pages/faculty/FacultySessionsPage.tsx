import React, { useState, useEffect } from 'react';
import { QrCode, Clock, Users, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import { AttendanceSession, Subject, CollegeClass } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Badge } from '../../components/common/UIComponents';
import { QRSessionModal } from '../../components/qr/QRSessionModal';

export const FacultySessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<CollegeClass[]>([]);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

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

    try {
      const raw = localStorage.getItem('smartattend_sessions');
      if (raw) {
        setSessions(JSON.parse(raw));
      }
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">QR Attendance Sessions</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor active dynamic QR codes, token lifetimes, and historical attendance sessions
          </p>
        </div>

        <Button
          variant="primary"
          icon={QrCode}
          onClick={() => setIsQRModalOpen(true)}
        >
          Launch New QR Session
        </Button>
      </div>

      {/* Sessions Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Session Token ID</th>
                <th className="py-3 px-4">Subject & Class</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No dynamic QR sessions launched yet. Click "Launch New QR Session" to begin.
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => {
                  const isExpired = Date.now() > sess.expiresAt || sess.status === 'completed';
                  return (
                    <tr key={sess.sessionId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-indigo-600 font-bold">
                        {sess.sessionId.slice(0, 18)}...
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {sess.subjectId} ({sess.classId.toUpperCase()})
                      </td>
                      <td className="py-3 px-4 text-slate-600">{sess.period}</td>
                      <td className="py-3 px-4 font-mono">{sess.duration} seconds</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            !isExpired
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {!isExpired ? 'Active' : 'Expired / Closed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {new Date(sess.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <QRSessionModal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          load();
        }}
        subjects={subjects}
        classes={classes}
        onSessionCreated={() => load()}
      />
    </div>
  );
};
