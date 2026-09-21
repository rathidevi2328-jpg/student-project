export type UserRole = 'admin' | 'faculty' | 'student';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  facultyId?: string;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Student {
  studentId: string;
  registerNumber: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  departmentId: string;
  course: string;
  year: number;
  section: string;
  profilePhoto?: string;
  faceData?: string; // biometric template representation
  isActive: boolean;
  createdAt: string;
}

export interface Faculty {
  facultyId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  departmentId: string;
  designation: string;
  profilePhoto?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Department {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  createdAt: string;
}

export interface Subject {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  departmentId: string;
  semester: number;
  year: number;
  facultyId: string;
  classId: string;
  createdAt: string;
}

export interface CollegeClass {
  classId: string;
  className: string; // e.g. "CSE-A", "ECE-B"
  departmentId: string;
  year: number;
  section: string;
  academicYear: string;
  studentIds: string[];
}

export interface AttendanceSession {
  sessionId: string;
  classId: string;
  subjectId: string;
  facultyId: string;
  date: string; // YYYY-MM-DD
  period: string; // e.g. "Period 1 (09:00 - 10:00)"
  duration: number; // in seconds: 30, 60, 120, 300
  startedAt: number; // timestamp ms
  expiresAt: number; // timestamp ms
  secureToken: string;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export type VerificationMethod = 'manual' | 'qr' | 'qr_location' | 'qr_face' | 'qr_location_face';

export interface AttendanceRecord {
  attendanceId: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  facultyId: string;
  date: string; // YYYY-MM-DD
  period?: string;
  timestamp: string; // ISO string
  status: AttendanceStatus;
  verificationMethod: VerificationMethod;
  locationVerified: boolean;
  faceVerified: boolean;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  notificationId: string;
  userId: string;
  role?: UserRole;
  title: string;
  message: string;
  type: 'warning' | 'success' | 'info' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLog {
  logId: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SystemSettings {
  attendanceThreshold: number; // default 75 (%)
  attendanceLocation: {
    name: string;
    latitude: number;
    longitude: number;
    allowedRadius: number; // in meters (default 100)
  };
  faceVerificationEnabled: boolean;
  defaultQrDuration: number; // in seconds (30, 60, 120, 300)
  allowManualOverride: boolean;
  semesterName: string;
}
