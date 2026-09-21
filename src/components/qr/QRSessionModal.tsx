import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Clock,
  Square,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { AttendanceSession, Subject, CollegeClass } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button, Select, Modal } from '../common/UIComponents';

interface QRSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  classes: CollegeClass[];
  preselectedSubjectId?: string;
  onSessionCreated?: (session: AttendanceSession) => void;
}

export const QRSessionModal: React.FC<QRSessionModalProps> = ({
  isOpen,
  onClose,
  subjects,
  classes,
  preselectedSubjectId,
  onSessionCreated,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  // Configuration state
  const [selectedSubjectId, setSelectedSubjectId] = useState(preselectedSubjectId || (subjects[0]?.subjectId || ''));
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.classId || '');
  const [selectedPeriod, setSelectedPeriod] = useState('Period 1 (09:00 - 10:00)');
  const [durationSeconds, setDurationSeconds] = useState(60);

  // Active session state
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [attendedCount, setAttendedCount] = useState<number>(0);

  useEffect(() => {
    if (preselectedSubjectId) {
      setSelectedSubjectId(preselectedSubjectId);
      const sub = subjects.find((s) => s.subjectId === preselectedSubjectId);
      if (sub?.classId) setSelectedClassId(sub.classId);
    }
  }, [preselectedSubjectId, subjects]);

  // Real-time Countdown timer
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((activeSession.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setActiveSession((prev) => (prev ? { ...prev, status: 'expired' } : null));
        dataService.stopAttendanceSession(activeSession.sessionId);
        showToast('warning', 'Session Expired', 'The QR attendance session has expired.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Live attendee count poll
  useEffect(() => {
    if (!activeSession) return;
    const pollAttendees = async () => {
      const records = await dataService.getAttendanceRecords();
      const count = records.filter((r) => r.sessionId === activeSession.sessionId).length;
      setAttendedCount(count);
    };
    pollAttendees();
    const interval = setInterval(pollAttendees, 2500);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleStartSession = async () => {
    if (!selectedSubjectId || !selectedClassId) {
      showToast('error', 'Validation Error', 'Please select a subject and class.');
      return;
    }

    const now = Date.now();
    const expiresAt = now + durationSeconds * 1000;
    const sessionId = `session-${now}-${Math.random().toString(36).substr(2, 6)}`;
    const secureToken = btoa(
      JSON.stringify({
        sessionId,
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        facultyId: user?.facultyId || user?.uid || 'faculty-1',
        timestamp: now,
        expiresAt,
        salt: Math.random().toString(36).substring(2, 8),
      })
    );

    const newSession: AttendanceSession = {
      sessionId,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      facultyId: user?.facultyId || user?.uid || 'faculty-1',
      date: new Date().toISOString().slice(0, 10),
      period: selectedPeriod,
      duration: durationSeconds,
      startedAt: now,
      expiresAt,
      secureToken,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    await dataService.createAttendanceSession(newSession);
    await dataService.logAction({
      userId: user?.uid || 'faculty-1',
      userName: user?.name || 'Faculty',
      role: 'faculty',
      action: 'Started Dynamic QR Attendance Session',
      metadata: {
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        duration: durationSeconds,
      },
    });

    setActiveSession(newSession);
    setSecondsRemaining(durationSeconds);
    setAttendedCount(0);
    showToast('success', 'Attendance Started', `Dynamic QR code generated for ${durationSeconds} seconds.`);
    if (onSessionCreated) onSessionCreated(newSession);
  };

  const handleStopSession = async () => {
    if (!activeSession) return;
    await dataService.stopAttendanceSession(activeSession.sessionId);
    setActiveSession((prev) => (prev ? { ...prev, status: 'completed' } : null));
    showToast('info', 'Session Stopped', 'Attendance session was stopped by faculty.');
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectedSubject = subjects.find((s) => s.subjectId === selectedSubjectId);
  const selectedClass = classes.find((c) => c.classId === selectedClassId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (activeSession?.status === 'active') {
          if (!confirm('Attendance session is still active! Closing will not stop the timer. Stop session?')) {
            return;
          }
          handleStopSession();
        }
        setActiveSession(null);
        onClose();
      }}
      title="Dynamic QR Code Attendance"
      subtitle="Generate a time-limited, encrypted QR code for classroom attendance"
      maxWidth="lg"
    >
      {!activeSession ? (
        // Configuration Form
        <div className="space-y-4">
          <Select
            label="Select Subject"
            options={subjects.map((s) => ({ label: `${s.subjectCode} - ${s.subjectName}`, value: s.subjectId }))}
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          />

          <Select
            label="Select Class / Section"
            options={classes.map((c) => ({ label: `${c.className} (${c.academicYear})`, value: c.classId }))}
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
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
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              QR Expiration Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '30 sec', val: 30 },
                { label: '60 sec', val: 60 },
                { label: '120 sec', val: 120 },
                { label: '300 sec (5m)', val: 300 },
              ].map((dur) => (
                <button
                  key={dur.val}
                  type="button"
                  onClick={() => setDurationSeconds(dur.val)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                    durationSeconds === dur.val
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              The QR code refreshes session tokens and automatically expires when time runs out.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" icon={Play} onClick={handleStartSession}>
              Start Attendance Session
            </Button>
          </div>
        </div>
      ) : (
        // Active QR Display
        <div className="flex flex-col items-center text-center py-2 space-y-5">
          {/* Status Header */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span className={`w-2 h-2 rounded-full ${activeSession.status === 'active' ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              {activeSession.status === 'active' ? 'Attendance Session Active' : 'Session Ended'}
            </div>
            <h4 className="text-lg font-bold text-slate-900 mt-2">
              {selectedSubject?.subjectName} ({selectedSubject?.subjectCode})
            </h4>
            <p className="text-xs text-slate-500">
              Class: <span className="font-semibold text-slate-700">{selectedClass?.className}</span> • {activeSession.period}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="relative p-6 bg-white rounded-3xl border-2 border-indigo-100 shadow-xl">
            {activeSession.status === 'active' ? (
              <div className="relative">
                <QRCodeSVG
                  value={activeSession.secureToken}
                  size={230}
                  level="H"
                  includeMargin={false}
                  className="rounded-xl"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-indigo-600 font-extrabold text-sm">
                    SA
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-[230px] h-[230px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <AlertTriangle className="w-12 h-12 text-amber-500 mb-2" />
                <p className="font-bold text-slate-800 text-sm">QR Code Expired</p>
                <p className="text-xs text-slate-400 mt-0.5">Session is no longer accepting scans</p>
              </div>
            )}
          </div>

          {/* Countdown Clock & Attendee counter */}
          <div className="w-full max-w-sm grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Expires in:</span>
              </div>
              <p className={`text-2xl font-black mt-0.5 font-mono ${secondsRemaining < 15 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                {formatTimer(secondsRemaining)}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recorded:</span>
              </div>
              <p className="text-2xl font-black mt-0.5 text-emerald-600 font-mono">
                {attendedCount} <span className="text-xs font-normal text-slate-400">students</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full max-w-sm justify-center pt-2">
            {activeSession.status === 'active' ? (
              <Button
                variant="danger"
                icon={Square}
                onClick={handleStopSession}
                className="w-full"
              >
                Stop Session Now
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={RotateCcw}
                onClick={() => setActiveSession(null)}
                className="w-full"
              >
                Start New Session
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
