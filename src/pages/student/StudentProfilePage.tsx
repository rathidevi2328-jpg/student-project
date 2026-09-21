import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Camera,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sparkles,
  Phone,
  Mail,
  GraduationCap,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Student } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { extractFaceDescriptorFromVideo } from '../../utils/faceBiometrics';
import { Card, Button, Badge } from '../../components/common/UIComponents';

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [student, setStudent] = useState<Student | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadStudent = async () => {
    const stId = user?.studentId || 'student-1';
    const st = await dataService.getStudentById(stId);
    setStudent(st);
  };

  useEffect(() => {
    loadStudent();
    return () => {
      stopCamera();
    };
  }, [user]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      showToast('error', 'Camera Error', 'Could not open device webcam. Please check browser permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCaptureFace = async () => {
    if (!videoRef.current || !student) return;
    setIsCapturing(true);

    try {
      const descriptor = extractFaceDescriptorFromVideo(videoRef.current);
      if (!descriptor) {
        throw new Error('Could not extract biometric face features. Please align your face inside the frame.');
      }

      const updated: Student = {
        ...student,
        faceData: descriptor,
      };

      await dataService.saveStudent(updated);
      await dataService.logAction({
        userId: student.studentId,
        userName: student.name,
        role: 'student',
        action: 'Registered Facial Biometric Signature',
        metadata: { timestamp: new Date().toISOString() },
      });

      setStudent(updated);
      stopCamera();
      showToast('success', 'Face Data Registered', 'Your facial biometric profile has been securely enrolled.');
    } catch (err: any) {
      showToast('error', 'Biometric Enrollment Failed', err.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClearFaceData = async () => {
    if (!student) return;
    if (confirm('Remove enrolled facial biometric profile? You may need to re-register before facial verification.')) {
      const updated: Student = {
        ...student,
        faceData: undefined,
      };
      await dataService.saveStudent(updated);
      setStudent(updated);
      showToast('info', 'Face Data Cleared', 'Facial biometrics removed.');
    }
  };

  if (!student) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Profile & Biometrics</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage academic identity, enrollment details, and device biometric authentication
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-200 ring-4 ring-indigo-50">
            {student.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                <p className="text-xs font-mono font-bold text-indigo-600">{student.registerNumber}</p>
              </div>
              <Badge variant={student.isActive ? 'success' : 'danger'}>
                {student.isActive ? 'Enrolled Active Student' : 'Inactive'}
              </Badge>
            </div>

            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <p className="flex items-center gap-2 justify-center sm:justify-start">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{student.email}</span>
              </p>
              <p className="flex items-center gap-2 justify-center sm:justify-start">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{student.phone}</span>
              </p>
              <p className="flex items-center gap-2 justify-center sm:justify-start">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{student.department}</span>
              </p>
              <p className="flex items-center gap-2 justify-center sm:justify-start">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>{student.course} (Year {student.year}, Sec {student.section})</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Face Biometric Enrollment Card (Section 15 requirement) */}
      <Card
        title="Facial Biometric Enrollment"
        subtitle="Register your face vector using your webcam for contactless classroom verification"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  student.faceData
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}
              >
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">
                  Status: {student.faceData ? 'Facial Biometrics Registered' : 'Not Yet Enrolled'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {student.faceData
                    ? 'Biometric descriptor is ready for QR attendance verification.'
                    : 'Enroll your face to enable 1-step biometric verification during QR check-in.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {student.faceData && (
                <Button variant="outline" size="sm" onClick={handleClearFaceData}>
                  Clear Data
                </Button>
              )}
              {!cameraActive ? (
                <Button variant="primary" size="sm" icon={Camera} onClick={startCamera}>
                  {student.faceData ? 'Re-enroll Face' : 'Open Camera to Enroll'}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={stopCamera}>
                  Close Camera
                </Button>
              )}
            </div>
          </div>

          {/* Camera Viewfinder */}
          {cameraActive && (
            <div className="p-4 bg-slate-950 rounded-2xl flex flex-col items-center justify-center space-y-4 animate-scale-in">
              <div className="relative w-full max-w-sm aspect-video sm:aspect-square bg-slate-900 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-2xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                {/* Facial alignment oval guide */}
                <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-full pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded-full">
                    Align Face Here
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={stopCamera}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={Sparkles}
                  onClick={handleCaptureFace}
                  disabled={isCapturing}
                >
                  {isCapturing ? 'Analyzing Biometrics...' : 'Capture & Save Biometric Vector'}
                </Button>
              </div>
            </div>
          )}

          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11px] text-slate-500 leading-relaxed">
            <span className="font-bold text-indigo-900">Privacy Notice: </span>
            SmartAttend does not record or upload raw camera video files. A mathematical 64-dimensional luminance and spatial variance histogram vector is extracted entirely in your local browser and stored as a lightweight numerical template.
          </div>
        </div>
      </Card>
    </div>
  );
};
