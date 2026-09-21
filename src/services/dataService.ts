import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
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
import {
  INITIAL_SETTINGS,
  INITIAL_DEPARTMENTS,
  INITIAL_CLASSES,
  INITIAL_FACULTY,
  INITIAL_SUBJECTS,
  INITIAL_STUDENTS,
  INITIAL_USERS,
  generateInitialAttendanceRecords,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './seedService';

// Keys for local simulation fallback
const STORAGE_KEYS = {
  SETTINGS: 'smartattend_settings',
  DEPARTMENTS: 'smartattend_departments',
  CLASSES: 'smartattend_classes',
  FACULTY: 'smartattend_faculty',
  SUBJECTS: 'smartattend_subjects',
  STUDENTS: 'smartattend_students',
  USERS: 'smartattend_users',
  ATTENDANCE: 'smartattend_attendance',
  SESSIONS: 'smartattend_sessions',
  NOTIFICATIONS: 'smartattend_notifications',
  AUDIT_LOGS: 'smartattend_audit_logs',
};

function getLocalData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to write local data for ${key}:`, err);
  }
}

// Ensure seed data exists locally
export function initializeSeedDataIfEmpty(): void {
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(INITIAL_FACULTY));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(generateInitialAttendanceRecords()));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  }
}

// Trigger initial setup
initializeSeedDataIfEmpty();

export const dataService = {
  // RESET / RE-SEED DATA
  async resetToSeedData(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(INITIAL_FACULTY));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(generateInitialAttendanceRecords()));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'systemSettings', 'attendanceConfig'), INITIAL_SETTINGS);
        for (const d of INITIAL_DEPARTMENTS) await setDoc(doc(db, 'departments', d.departmentId), d);
        for (const c of INITIAL_CLASSES) await setDoc(doc(db, 'classes', c.classId), c);
        for (const f of INITIAL_FACULTY) await setDoc(doc(db, 'faculty', f.facultyId), f);
        for (const s of INITIAL_SUBJECTS) await setDoc(doc(db, 'subjects', s.subjectId), s);
        for (const st of INITIAL_STUDENTS) await setDoc(doc(db, 'students', st.studentId), st);
      } catch (err) {
        console.warn('Firebase seeding error:', err);
      }
    }
  },

  // SETTINGS
  async getSettings(): Promise<SystemSettings> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'systemSettings', 'attendanceConfig'));
        if (snap.exists()) return snap.data() as SystemSettings;
      } catch (e) {
        console.warn('Falling back to local settings:', e);
      }
    }
    return getLocalData<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    setLocalData(STORAGE_KEYS.SETTINGS, updated);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'systemSettings', 'attendanceConfig'), updated, { merge: true });
      } catch (err) {
        console.warn('Firestore updateSettings error:', err);
      }
    }
    return updated;
  },

  // STUDENTS
  async getStudents(): Promise<Student[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'students'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Student);
        }
      } catch (e) {
        console.warn('Firestore getStudents error:', e);
      }
    }
    return getLocalData<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  },

  async getStudentById(id: string): Promise<Student | null> {
    const students = await this.getStudents();
    return students.find((s) => s.studentId === id) || null;
  },

  async saveStudent(student: Student): Promise<void> {
    const students = await this.getStudents();
    const idx = students.findIndex((s) => s.studentId === student.studentId);
    let updated: Student[];
    if (idx >= 0) {
      updated = [...students];
      updated[idx] = student;
    } else {
      updated = [student, ...students];
    }
    setLocalData(STORAGE_KEYS.STUDENTS, updated);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'students', student.studentId), student);
      } catch (e) {
        console.warn('Firestore saveStudent error:', e);
      }
    }
  },

  async toggleStudentActive(id: string, isActive: boolean): Promise<void> {
    const student = await this.getStudentById(id);
    if (student) {
      await this.saveStudent({ ...student, isActive });
    }
  },

  // FACULTY
  async getFaculty(): Promise<Faculty[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'faculty'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Faculty);
        }
      } catch (e) {
        console.warn('Firestore getFaculty error:', e);
      }
    }
    return getLocalData<Faculty[]>(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
  },

  async getFacultyById(id: string): Promise<Faculty | null> {
    const faculty = await this.getFaculty();
    return faculty.find((f) => f.facultyId === id) || null;
  },

  async saveFaculty(fac: Faculty): Promise<void> {
    const list = await this.getFaculty();
    const idx = list.findIndex((f) => f.facultyId === fac.facultyId);
    let updated: Faculty[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = fac;
    } else {
      updated = [fac, ...list];
    }
    setLocalData(STORAGE_KEYS.FACULTY, updated);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'faculty', fac.facultyId), fac);
      } catch (e) {
        console.warn('Firestore saveFaculty error:', e);
      }
    }
  },

  async toggleFacultyActive(id: string, isActive: boolean): Promise<void> {
    const fac = await this.getFacultyById(id);
    if (fac) {
      await this.saveFaculty({ ...fac, isActive });
    }
  },

  // DEPARTMENTS
  async getDepartments(): Promise<Department[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'departments'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Department);
        }
      } catch (e) {
        console.warn('Firestore getDepartments error:', e);
      }
    }
    return getLocalData<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  },

  async saveDepartment(dept: Department): Promise<void> {
    const list = await this.getDepartments();
    const idx = list.findIndex((d) => d.departmentId === dept.departmentId);
    let updated: Department[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = dept;
    } else {
      updated = [dept, ...list];
    }
    setLocalData(STORAGE_KEYS.DEPARTMENTS, updated);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'departments', dept.departmentId), dept);
      } catch (e) {
        console.warn('Firestore saveDepartment error:', e);
      }
    }
  },

  // CLASSES
  async getClasses(): Promise<CollegeClass[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as CollegeClass);
        }
      } catch (e) {
        console.warn('Firestore getClasses error:', e);
      }
    }
    return getLocalData<CollegeClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  },

  async saveClass(cls: CollegeClass): Promise<void> {
    const list = await this.getClasses();
    const idx = list.findIndex((c) => c.classId === cls.classId);
    let updated: CollegeClass[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = cls;
    } else {
      updated = [cls, ...list];
    }
    setLocalData(STORAGE_KEYS.CLASSES, updated);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'classes', cls.classId), cls);
      } catch (e) {
        console.warn('Firestore saveClass error:', e);
      }
    }
  },

  // SUBJECTS
  async getSubjects(): Promise<Subject[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'subjects'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Subject);
        }
      } catch (e) {
        console.warn('Firestore getSubjects error:', e);
      }
    }
    return getLocalData<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  },

  async getSubjectsByFaculty(facultyId: string): Promise<Subject[]> {
    const subs = await this.getSubjects();
    return subs.filter((s) => s.facultyId === facultyId);
  },

  async saveSubject(sub: Subject): Promise<void> {
    const list = await this.getSubjects();
    const idx = list.findIndex((s) => s.subjectId === sub.subjectId);
    let updated: Subject[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = sub;
    } else {
      updated = [sub, ...list];
    }
    setLocalData(STORAGE_KEYS.SUBJECTS, updated);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'subjects', sub.subjectId), sub);
      } catch (e) {
        console.warn('Firestore saveSubject error:', e);
      }
    }
  },

  // ATTENDANCE SESSIONS (Dynamic QR)
  async createAttendanceSession(session: AttendanceSession): Promise<AttendanceSession> {
    const sessions = getLocalData<AttendanceSession[]>(STORAGE_KEYS.SESSIONS, []);
    const updated = [session, ...sessions];
    setLocalData(STORAGE_KEYS.SESSIONS, updated);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'attendanceSessions', session.sessionId), session);
      } catch (e) {
        console.warn('Firestore createAttendanceSession error:', e);
      }
    }
    return session;
  },

  async getAttendanceSession(sessionId: string): Promise<AttendanceSession | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'attendanceSessions', sessionId));
        if (snap.exists()) return snap.data() as AttendanceSession;
      } catch (e) {
        console.warn('Firestore getAttendanceSession error:', e);
      }
    }
    const sessions = getLocalData<AttendanceSession[]>(STORAGE_KEYS.SESSIONS, []);
    return sessions.find((s) => s.sessionId === sessionId) || null;
  },

  async stopAttendanceSession(sessionId: string): Promise<void> {
    const sessions = getLocalData<AttendanceSession[]>(STORAGE_KEYS.SESSIONS, []);
    const idx = sessions.findIndex((s) => s.sessionId === sessionId);
    if (idx >= 0) {
      sessions[idx].status = 'completed';
      setLocalData(STORAGE_KEYS.SESSIONS, [...sessions]);
    }

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'attendanceSessions', sessionId), { status: 'completed' });
      } catch (e) {
        console.warn('Firestore stopAttendanceSession error:', e);
      }
    }
  },

  // ATTENDANCE RECORDS & DUPLICATE PREVENTION
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'attendance'));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as AttendanceRecord);
        }
      } catch (e) {
        console.warn('Firestore getAttendanceRecords error:', e);
      }
    }
    return getLocalData<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  },

  async getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
    const all = await this.getAttendanceRecords();
    return all.filter((r) => r.studentId === studentId);
  },

  async getAttendanceBySubject(subjectId: string): Promise<AttendanceRecord[]> {
    const all = await this.getAttendanceRecords();
    return all.filter((r) => r.subjectId === subjectId);
  },

  /**
   * Records attendance with strict duplicate check (using atomic logic/Firestore transaction)
   */
  async recordAttendance(record: AttendanceRecord): Promise<{ success: boolean; message: string }> {
    // 1. Check for duplicate attendance: student + subject + date + (period or sessionId)
    const allRecords = await this.getAttendanceRecords();
    const existing = allRecords.find((r) => {
      const sameStudent = r.studentId === record.studentId;
      const sameSubject = r.subjectId === record.subjectId;
      const sameDate = r.date === record.date;
      const sameSession = record.sessionId ? r.sessionId === record.sessionId : r.period === record.period;
      return sameStudent && sameSubject && sameDate && sameSession;
    });

    if (existing) {
      return {
        success: false,
        message: 'Attendance Already Recorded for this session and date.',
      };
    }

    // Save locally
    const updated = [record, ...allRecords];
    setLocalData(STORAGE_KEYS.ATTENDANCE, updated);

    // Save to Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        await runTransaction(db, async (transaction) => {
          const docRef = doc(db!, 'attendance', record.attendanceId);
          const sfDoc = await transaction.get(docRef);
          if (sfDoc.exists()) {
            throw new Error('Attendance Already Recorded');
          }
          transaction.set(docRef, record);
        });
      } catch (e: any) {
        console.warn('Firestore recordAttendance error:', e);
        if (e.message?.includes('Already Recorded')) {
          return { success: false, message: 'Attendance Already Recorded' };
        }
      }
    }

    // Auto-create notification for student
    await this.addNotification({
      notificationId: `notif-${Date.now()}`,
      userId: record.studentId,
      role: 'student',
      title: 'Attendance Marked Successfully',
      message: `Your attendance for ${record.subjectName} on ${record.date} has been recorded as ${record.status}.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Attendance Marked Successfully',
    };
  },

  async batchSaveAttendance(records: AttendanceRecord[]): Promise<void> {
    const existing = await this.getAttendanceRecords();
    // Replace records for matching student + subject + date + period
    const recordMap = new Map<string, AttendanceRecord>();
    for (const r of existing) {
      recordMap.set(`${r.studentId}_${r.subjectId}_${r.date}_${r.period || ''}`, r);
    }
    for (const r of records) {
      recordMap.set(`${r.studentId}_${r.subjectId}_${r.date}_${r.period || ''}`, r);
    }
    const updated = Array.from(recordMap.values());
    setLocalData(STORAGE_KEYS.ATTENDANCE, updated);

    if (isFirebaseConfigured && db) {
      try {
        for (const r of records) {
          await setDoc(doc(db, 'attendance', r.attendanceId), r);
        }
      } catch (e) {
        console.warn('Firestore batchSaveAttendance error:', e);
      }
    }
  },

  // NOTIFICATIONS
  async getNotifications(userId?: string): Promise<NotificationItem[]> {
    const all = getLocalData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (!userId) return all;
    return all.filter((n) => n.userId === userId || n.userId === 'all');
  },

  async addNotification(notif: NotificationItem): Promise<void> {
    const list = await this.getNotifications();
    setLocalData(STORAGE_KEYS.NOTIFICATIONS, [notif, ...list]);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'notifications', notif.notificationId), notif);
      } catch (e) {
        console.warn('Firestore addNotification error:', e);
      }
    }
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const list = await this.getNotifications();
    const updated = list.map((n) => (n.notificationId === notificationId ? { ...n, read: true } : n));
    setLocalData(STORAGE_KEYS.NOTIFICATIONS, updated);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'notifications', notificationId), { read: true });
      } catch (e) {
        console.warn('Firestore markNotificationAsRead error:', e);
      }
    }
  },

  // AUDIT LOGS
  async getAuditLogs(): Promise<AuditLog[]> {
    return getLocalData<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  async logAction(log: Omit<AuditLog, 'logId' | 'timestamp'>): Promise<void> {
    const newLog: AuditLog = {
      ...log,
      logId: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    const logs = await this.getAuditLogs();
    setLocalData(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'auditLogs', newLog.logId), newLog);
      } catch (e) {
        console.warn('Firestore logAction error:', e);
      }
    }
  },
};
