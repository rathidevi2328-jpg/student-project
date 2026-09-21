// Standalone Node.js script to seed Firestore database directly
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBL0tUp8Np7N7LzOYgPVhMlauQrhdPqiUw",
  authDomain: "student-project-c1c6c.firebaseapp.com",
  projectId: "student-project-c1c6c",
  storageBucket: "student-project-c1c6c.firebasestorage.app",
  messagingSenderId: "778882566324",
  appId: "1:778882566324:web:0ce9d0e6e647bd0ec1efe1",
  measurementId: "G-PV331WL63S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const INITIAL_SETTINGS = {
  attendanceThreshold: 75,
  attendanceLocation: {
    name: 'Main Academic Block & Lecture Hall A',
    latitude: 12.9716,
    longitude: 77.5946,
    allowedRadius: 100,
  },
  faceVerificationEnabled: true,
  defaultQrDuration: 60,
  allowManualOverride: true,
  semesterName: 'Fall Semester 2026',
};

const INITIAL_DEPARTMENTS = [
  { departmentId: 'dept-cse', departmentName: 'Computer Science & Engineering', departmentCode: 'CSE', createdAt: new Date().toISOString() },
  { departmentId: 'dept-it', departmentName: 'Information Technology', departmentCode: 'IT', createdAt: new Date().toISOString() },
  { departmentId: 'dept-ece', departmentName: 'Electronics & Communication', departmentCode: 'ECE', createdAt: new Date().toISOString() },
  { departmentId: 'dept-mech', departmentName: 'Mechanical Engineering', departmentCode: 'MECH', createdAt: new Date().toISOString() },
];

const INITIAL_CLASSES = [
  { classId: 'class-cse-a', className: 'CSE-A', departmentId: 'dept-cse', year: 3, section: 'A', academicYear: '2026-2027', studentIds: ['student-1', 'student-2', 'student-3', 'student-4', 'student-5'] },
  { classId: 'class-cse-b', className: 'CSE-B', departmentId: 'dept-cse', year: 3, section: 'B', academicYear: '2026-2027', studentIds: [] },
  { classId: 'class-it-a', className: 'IT-A', departmentId: 'dept-it', year: 2, section: 'A', academicYear: '2026-2027', studentIds: [] },
  { classId: 'class-ece-a', className: 'ECE-A', departmentId: 'dept-ece', year: 3, section: 'A', academicYear: '2026-2027', studentIds: [] },
];

const INITIAL_FACULTY = [
  { facultyId: 'faculty-1', name: 'Dr. Rajesh Sharma', email: 'faculty@smartattend.edu', phone: '+91 98765 43210', department: 'Computer Science & Engineering', departmentId: 'dept-cse', designation: 'Associate Professor', isActive: true, createdAt: new Date().toISOString() },
  { facultyId: 'faculty-2', name: 'Prof. Priya Venkat', email: 'priya.v@smartattend.edu', phone: '+91 98765 43211', department: 'Computer Science & Engineering', departmentId: 'dept-cse', designation: 'Assistant Professor', isActive: true, createdAt: new Date().toISOString() },
  { facultyId: 'faculty-3', name: 'Dr. Suresh Menon', email: 'suresh.m@smartattend.edu', phone: '+91 98765 43212', department: 'Electronics & Communication', departmentId: 'dept-ece', designation: 'Professor & HOD', isActive: true, createdAt: new Date().toISOString() },
];

const INITIAL_SUBJECTS = [
  { subjectId: 'sub-dbms', subjectCode: 'CS501', subjectName: 'Database Management Systems', departmentId: 'dept-cse', semester: 5, year: 3, facultyId: 'faculty-1', classId: 'class-cse-a', createdAt: new Date().toISOString() },
  { subjectId: 'sub-cn', subjectCode: 'CS502', subjectName: 'Computer Networks', departmentId: 'dept-cse', semester: 5, year: 3, facultyId: 'faculty-1', classId: 'class-cse-a', createdAt: new Date().toISOString() },
  { subjectId: 'sub-java', subjectCode: 'CS504', subjectName: 'Java Enterprise Systems', departmentId: 'dept-cse', semester: 5, year: 3, facultyId: 'faculty-1', classId: 'class-cse-a', createdAt: new Date().toISOString() },
  { subjectId: 'sub-os', subjectCode: 'CS503', subjectName: 'Operating Systems & Architecture', departmentId: 'dept-cse', semester: 5, year: 3, facultyId: 'faculty-2', classId: 'class-cse-a', createdAt: new Date().toISOString() },
];

const INITIAL_STUDENTS = [
  { studentId: 'student-1', registerNumber: 'REG2023CS042', name: 'Alex Rivera', email: 'student@smartattend.edu', phone: '+91 91234 56780', department: 'Computer Science & Engineering', departmentId: 'dept-cse', course: 'B.Tech Computer Science', year: 3, section: 'A', isActive: true, createdAt: new Date().toISOString() },
  { studentId: 'student-2', registerNumber: 'REG2023CS015', name: 'Sarah Chen', email: 'sarah.chen@smartattend.edu', phone: '+91 91234 56781', department: 'Computer Science & Engineering', departmentId: 'dept-cse', course: 'B.Tech Computer Science', year: 3, section: 'A', isActive: true, createdAt: new Date().toISOString() },
  { studentId: 'student-3', registerNumber: 'REG2023CS088', name: 'Rohan Gupta', email: 'rohan.gupta@smartattend.edu', phone: '+91 91234 56782', department: 'Computer Science & Engineering', departmentId: 'dept-cse', course: 'B.Tech Computer Science', year: 3, section: 'A', isActive: true, createdAt: new Date().toISOString() },
  { studentId: 'student-4', registerNumber: 'REG2023CS099', name: 'Emily Watson', email: 'emily.watson@smartattend.edu', phone: '+91 91234 56783', department: 'Computer Science & Engineering', departmentId: 'dept-cse', course: 'B.Tech Computer Science', year: 3, section: 'A', isActive: true, createdAt: new Date().toISOString() },
  { studentId: 'student-5', registerNumber: 'REG2023CS071', name: 'Michael Chang', email: 'michael.chang@smartattend.edu', phone: '+91 91234 56784', department: 'Computer Science & Engineering', departmentId: 'dept-cse', course: 'B.Tech Computer Science', year: 3, section: 'A', isActive: true, createdAt: new Date().toISOString() },
];

async function seed() {
  console.log('Seeding Firestore for project:', firebaseConfig.projectId);
  try {
    await setDoc(doc(db, 'systemSettings', 'attendanceConfig'), INITIAL_SETTINGS);
    console.log('✓ System Settings created');

    for (const d of INITIAL_DEPARTMENTS) {
      await setDoc(doc(db, 'departments', d.departmentId), d);
    }
    console.log('✓ Departments created (4)');

    for (const c of INITIAL_CLASSES) {
      await setDoc(doc(db, 'classes', c.classId), c);
    }
    console.log('✓ Classes created (4)');

    for (const f of INITIAL_FACULTY) {
      await setDoc(doc(db, 'faculty', f.facultyId), f);
    }
    console.log('✓ Faculty members created (3)');

    for (const s of INITIAL_SUBJECTS) {
      await setDoc(doc(db, 'subjects', s.subjectId), s);
    }
    console.log('✓ Subjects created (4)');

    for (const st of INITIAL_STUDENTS) {
      await setDoc(doc(db, 'students', st.studentId), st);
    }
    console.log('✓ Students enrolled (5)');

    console.log('\n🚀 Firestore database populated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
