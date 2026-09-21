import {
  Department,
  CollegeClass,
  Faculty,
  Student,
  Subject,
  AttendanceRecord,
  AttendanceSession,
  NotificationItem,
  AuditLog,
  SystemSettings,
  UserProfile,
} from '../types';

export const INITIAL_SETTINGS: SystemSettings = {
  attendanceThreshold: 75,
  attendanceLocation: {
    name: 'Main Academic Block & Lecture Hall A',
    latitude: 12.9716,
    longitude: 77.5946,
    allowedRadius: 100, // meters
  },
  faceVerificationEnabled: true,
  defaultQrDuration: 60,
  allowManualOverride: true,
  semesterName: 'Fall Semester 2026',
};

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    departmentId: 'dept-cse',
    departmentName: 'Computer Science & Engineering',
    departmentCode: 'CSE',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    departmentId: 'dept-it',
    departmentName: 'Information Technology',
    departmentCode: 'IT',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    departmentId: 'dept-ece',
    departmentName: 'Electronics & Communication',
    departmentCode: 'ECE',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    departmentId: 'dept-mech',
    departmentName: 'Mechanical Engineering',
    departmentCode: 'MECH',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
];

export const INITIAL_CLASSES: CollegeClass[] = [
  {
    classId: 'class-cse-a',
    className: 'CSE-A',
    departmentId: 'dept-cse',
    year: 3,
    section: 'A',
    academicYear: '2026-2027',
    studentIds: ['student-1', 'student-2', 'student-3', 'student-4', 'student-5'],
  },
  {
    classId: 'class-cse-b',
    className: 'CSE-B',
    departmentId: 'dept-cse',
    year: 3,
    section: 'B',
    academicYear: '2026-2027',
    studentIds: [],
  },
  {
    classId: 'class-it-a',
    className: 'IT-A',
    departmentId: 'dept-it',
    year: 2,
    section: 'A',
    academicYear: '2026-2027',
    studentIds: [],
  },
  {
    classId: 'class-ece-a',
    className: 'ECE-A',
    departmentId: 'dept-ece',
    year: 3,
    section: 'A',
    academicYear: '2026-2027',
    studentIds: [],
  },
];

export const INITIAL_FACULTY: Faculty[] = [
  {
    facultyId: 'faculty-1',
    name: 'Dr. Rajesh Sharma',
    email: 'faculty@smartattend.edu',
    phone: '+91 98765 43210',
    department: 'Computer Science & Engineering',
    departmentId: 'dept-cse',
    designation: 'Associate Professor',
    isActive: true,
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    facultyId: 'faculty-2',
    name: 'Prof. Priya Venkat',
    email: 'priya.v@smartattend.edu',
    phone: '+91 98765 43211',
    department: 'Computer Science & Engineering',
    departmentId: 'dept-cse',
    designation: 'Assistant Professor',
    isActive: true,
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    facultyId: 'faculty-3',
    name: 'Dr. Suresh Menon',
    email: 'suresh.m@smartattend.edu',
    phone: '+91 98765 43212',
    department: 'Electronics & Communication',
    departmentId: 'dept-ece',
    designation: 'Professor & HOD',
    isActive: true,
    createdAt: '2026-01-15T09:00:00.000Z',
  },
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    subjectId: 'sub-dbms',
    subjectCode: 'CS501',
    subjectName: 'Database Management Systems',
    departmentId: 'dept-cse',
    semester: 5,
    year: 3,
    facultyId: 'faculty-1',
    classId: 'class-cse-a',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    subjectId: 'sub-cn',
    subjectCode: 'CS502',
    subjectName: 'Computer Networks',
    departmentId: 'dept-cse',
    semester: 5,
    year: 3,
    facultyId: 'faculty-1',
    classId: 'class-cse-a',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    subjectId: 'sub-java',
    subjectCode: 'CS504',
    subjectName: 'Java Enterprise Systems',
    departmentId: 'dept-cse',
    semester: 5,
    year: 3,
    facultyId: 'faculty-1',
    classId: 'class-cse-a',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    subjectId: 'sub-os',
    subjectCode: 'CS503',
    subjectName: 'Operating Systems & Architecture',
    departmentId: 'dept-cse',
    semester: 5,
    year: 3,
    facultyId: 'faculty-2',
    classId: 'class-cse-a',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    studentId: 'student-1',
    registerNumber: 'REG2023CS042',
    name: 'Alex Rivera',
    email: 'student@smartattend.edu',
    phone: '+91 91234 56780',
    department: 'Computer Science & Engineering',
    departmentId: 'dept-cse',
    course: 'B.Tech Computer Science',
    year: 3,
    section: 'A',
    isActive: true,
    faceData: JSON.stringify({
      vector: Array(64).fill(0.125), // Baseline enrolled face vector
      timestamp: '2026-08-15T10:00:00.000Z',
    }),
    createdAt: '2026-07-20T09:00:00.000Z',
  },
  {
    studentId: 'student-2',
    registerNumber: 'REG2023CS015',
    name: 'Sarah Chen',
    email: 'sarah.chen@smartattend.edu',
    phone: '+91 91234 56781',
    department: 'Computer Science & Engineering',
    departmentId: 'dept-cse',
    course: 'B.Tech Computer Science',
    year: 3,
    section: 'A',
    isActive: true,
    createdAt: '2026-07-20T09:00:00.000Z',
  },
  {
    studentId: 'student-3',
    registerNumber: 'REG2023CS088',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@smartattend.edu',
    phone: '+91 91234 56782',
    department: 'Computer Science & Engineering',
    departmentId: 'dept-cse',
    course: 'B.Tech Computer Science',
    year: 3,
    section: 'A',
    isActive: true,
    createdAt: '2026-07-20T09:00:00.000Z',
  },
  {
    studentId: 'student-4',
    registerNumber: 'REG2023CS099',
    name: 'Emily Watson',
    email: 'emily.watson@smartattend.edu',
    phone: '+91 91234 56783',
    department: 'Computer Science & Engineering',
    departmentId: 'dept-cse',
    course: 'B.Tech Computer Science',
    year: 3,
    section: 'A',
    isActive: true,
    createdAt: '2026-07-20T09:00:00.000Z',
  },
  {
    studentId: 'student-5',
    registerNumber: 'REG2023CS071',
    name: 'Michael Chang',
    email: 'michael.chang@smartattend.edu',
    phone: '+91 91234 56784',
    department: 'Computer Science & Engineering',
    departmentId: 'dept-cse',
    course: 'B.Tech Computer Science',
    year: 3,
    section: 'A',
    isActive: true,
    createdAt: '2026-07-20T09:00:00.000Z',
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'user-admin',
    name: 'Dr. Administrator',
    email: 'admin@smartattend.edu',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isActive: true,
  },
  {
    uid: 'user-faculty-1',
    name: 'Dr. Rajesh Sharma',
    email: 'faculty@smartattend.edu',
    role: 'faculty',
    facultyId: 'faculty-1',
    departmentId: 'dept-cse',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
    isActive: true,
  },
  {
    uid: 'user-student-1',
    name: 'Alex Rivera',
    email: 'student@smartattend.edu',
    role: 'student',
    studentId: 'student-1',
    departmentId: 'dept-cse',
    createdAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-20T09:00:00.000Z',
    isActive: true,
  },
];

// Generate 30 days of realistic attendance records matching the exact prompt metrics
export function generateInitialAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const subjects = INITIAL_SUBJECTS;
  const today = new Date('2026-09-21T10:00:00.000Z');

  // Let's generate records across past 25 school days
  let idCounter = 1;

  for (let d = 25; d >= 1; d--) {
    const recordDate = new Date(today);
    recordDate.setDate(recordDate.getDate() - d);

    // Skip weekends (Saturday: 6, Sunday: 0)
    const dayOfWeek = recordDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = recordDate.toISOString().slice(0, 10);

    subjects.forEach((sub, subIdx) => {
      INITIAL_STUDENTS.forEach((st) => {
        let status: 'Present' | 'Absent' | 'Late' = 'Present';

        // For Alex Rivera (student-1):
        // DBMS: 92% (high)
        // Java: 86% (good)
        // Networks: 74% (low attendance warning!)
        // OS: 89% (good)
        if (st.studentId === 'student-1') {
          if (sub.subjectId === 'sub-cn') {
            // Networks: 74%
            if (d % 4 === 0) status = 'Absent';
          } else if (sub.subjectId === 'sub-java') {
            // Java: ~86%
            if (d === 7 || d === 18) status = 'Absent';
          } else if (sub.subjectId === 'sub-os') {
            // OS: ~89%
            if (d === 11) status = 'Absent';
          } else {
            // DBMS: ~92%
            if (d === 14) status = 'Absent';
          }
        } else {
          // Other students
          if ((d + subIdx) % 8 === 0) {
            status = 'Absent';
          } else if ((d + subIdx) % 12 === 0) {
            status = 'Late';
          }
        }

        records.push({
          attendanceId: `att-${idCounter++}`,
          studentId: st.studentId,
          studentName: st.name,
          registerNumber: st.registerNumber,
          subjectId: sub.subjectId,
          subjectName: sub.subjectName,
          classId: 'class-cse-a',
          facultyId: sub.facultyId,
          date: dateStr,
          period: `Period ${subIdx + 1}`,
          timestamp: `${dateStr}T${String(9 + subIdx).padStart(2, '0')}:30:00.000Z`,
          status,
          verificationMethod: (d % 2 === 0 ? 'qr_location' : 'manual'),
          locationVerified: d % 2 === 0,
          faceVerified: false,
          createdAt: `${dateStr}T${String(9 + subIdx).padStart(2, '0')}:30:00.000Z`,
          updatedAt: `${dateStr}T${String(9 + subIdx).padStart(2, '0')}:30:00.000Z`,
        });
      });
    });
  }

  return records;
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    notificationId: 'notif-1',
    userId: 'user-student-1',
    role: 'student',
    title: '⚠️ Low Attendance Warning',
    message: 'Your attendance in Computer Networks is currently 74.0%, which is below the mandatory 75% threshold. Please ensure regular attendance.',
    type: 'warning',
    read: false,
    createdAt: '2026-09-20T08:30:00.000Z',
  },
  {
    notificationId: 'notif-2',
    userId: 'user-student-1',
    role: 'student',
    title: 'Attendance Recorded',
    message: 'Your attendance for Database Management Systems was successfully recorded via QR Code.',
    type: 'success',
    read: true,
    createdAt: '2026-09-19T10:35:00.000Z',
  },
  {
    notificationId: 'notif-3',
    userId: 'user-faculty-1',
    role: 'faculty',
    title: 'Upcoming Session Notice',
    message: 'Reminder: Period 2 Computer Networks for CSE-A begins at 10:15 AM today.',
    type: 'info',
    read: false,
    createdAt: '2026-09-21T07:45:00.000Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    logId: 'log-1',
    userId: 'user-admin',
    userName: 'Dr. Administrator',
    role: 'admin',
    action: 'System Configuration Initialized',
    timestamp: '2026-09-15T09:00:00.000Z',
    metadata: { threshold: 75, allowedRadius: 100, faceVerification: true },
  },
  {
    logId: 'log-2',
    userId: 'user-admin',
    userName: 'Dr. Administrator',
    role: 'admin',
    action: 'Enrolled New Faculty Dr. Rajesh Sharma',
    timestamp: '2026-09-16T11:20:00.000Z',
    metadata: { department: 'CSE', designation: 'Associate Professor' },
  },
  {
    logId: 'log-3',
    userId: 'user-faculty-1',
    userName: 'Dr. Rajesh Sharma',
    role: 'faculty',
    action: 'Generated Dynamic QR Attendance Session',
    timestamp: '2026-09-20T09:15:00.000Z',
    metadata: { subject: 'Database Management Systems', class: 'CSE-A', duration: 60 },
  },
  {
    logId: 'log-4',
    userId: 'user-student-1',
    userName: 'Alex Rivera',
    role: 'student',
    action: 'Marked QR Attendance with Geolocation Verification',
    timestamp: '2026-09-20T09:16:12.000Z',
    metadata: { distanceMeters: 18, verified: true },
  },
];
