# SmartAttend – Smart Student Attendance Management System

> **Tagline**: “Smart Attendance. Simple Management.”

SmartAttend is a modern, responsive, full-stack college student attendance management platform built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Firebase** (Authentication, Firestore, Storage). It features **dynamic time-expiring QR code generation**, **in-browser camera QR scanning**, **geolocation radius verification (Haversine formula)**, **biometric facial signature verification**, **attendance prediction analytics**, **PDF/CSV reporting**, and **audit logging**.

---

## Key Features

### 1. Role-Based Portals & Access Control
- **Admin Portal**:
  - Comprehensive institutional dashboard with metrics: Total Students, Total Faculty, Today's Attendance %, Average Attendance, and Low Attendance alerts.
  - Analytics charts: Attendance Over Time (Line Chart), Department Comparison (Bar Chart), and Distribution (Donut Pie Chart: Present, Absent, Late).
  - Student Management: Search (Name, Register No, Email), filters (Dept, Year, Section), enrollment, editing, and soft deactivation.
  - Faculty Management: Registration, contact profiles, subject assignment, and session activity tracking.
  - Department Management: Custom departments with codes and names.
  - Course & Subject Management: Curriculum subject codes, semester, year, linked classes, and professor allocation.
  - Class Cohort Management: Class section codes (CSE-A, CSE-B, IT-A, ECE-A) and academic year mappings.
  - Global Attendance Ledger: Filterable and paginated table with location and face verification flags.
  - System Settings: Threshold configuration (default 75%), Geolocation campus coordinates (lat/lng), Allowed Radius (default 100m), Default QR duration (30s–300s), and Biometric toggle.
  - Audit Trail: Immutable security and operation audit log with metadata JSON inspector.

- **Faculty Portal**:
  - Live dashboard with today's class schedule, session counts, and average course attendance.
  - Dynamic QR Attendance Session Generator:
    - Time-limited sessions (30s, 60s, 120s, 300s).
    - Cryptographically structured and time-expiring attendance tokens.
    - Live countdown clock and real-time student check-in counters.
    - Early session stop control.
  - Interactive Manual Attendance Sheet:
    - Roster view with Present, Absent, and Late toggles.
    - Quick "Mark All Present" batch action.
    - Pre-save confirmation dialog with attendance count summaries.
  - Subject Performance Analytics: Individual student attendance percentage and low-attendance warnings.
  - Dispatch Attendance Alerts: One-click alert notifications sent directly to students falling below the 75% threshold.
  - Export Course Reports: Download clean CSV and professional PDF reports.

- **Student Portal**:
  - Personalized Dashboard: "Good Morning, [Name]", Overall Attendance %, Total Present / Absent / Conducted class counts.
  - Course Subject Cards: Subject attendance rates with progress bars and risk indicators.
  - Low Attendance Warning Banner: Highlights subjects with attendance below 75%.
  - Smart Risk Prediction: Transparent mathematical estimation:
    - Risk Tier: Low / Medium / High Risk.
    - Classes needed consecutively to reach 75%: `⌈(0.75 × Total - Present) / 0.25⌉`.
    - Buffer classes that can be missed while remaining ≥75%: `⌊(Present - 0.75 × Total) / 0.75⌋`.
  - Camera QR Scanner:
    - Front/back camera selector with video viewfinder.
    - Token validity & expiration verification.
    - Duplicate attendance prevention (atomic check for student + subject + date + session).
    - Geolocation geofencing check against campus coordinates and allowed radius.
    - Facial biometric verification against enrolled vector template.
    - Digital attendance receipt with date, time, subject, and verification status.
  - Monthly Attendance Calendar: Interactive grid with visual status badges (`P`, `A`, `L`) and date drilldown inspection modal.
  - Biometric Face Registration: Webcam capture that calculates and registers a 64-dimensional luminance/variance feature vector without uploading raw video.
  - Student Notification Inbox: Filterable alerts for low attendance and check-in receipts.

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, React Router DOM v6, Recharts
- **Backend & Database**: Firebase Authentication, Cloud Firestore, Firebase Storage
- **Camera & Barcode**: HTML5 QR Code (`html5-qrcode`), `qrcode.react`, Canvas API
- **Document Export**: `jspdf`, `jspdf-autotable`, native CSV Blob streaming
- **Hosting**: Vercel (Frontend SPA), Google Cloud / Firebase (Backend)

---

## Directory Structure

```
smartattend/
├── .env.example               # Environment variable templates
├── firestore.rules            # Production Firestore security rules
├── storage.rules              # Production Firebase Storage security rules
├── vercel.json                # Vercel SPA routing rewrite rules
├── package.json               # Dependencies and build scripts
├── vite.config.ts             # Vite bundler configuration
├── tailwind.config.js         # Tailwind CSS design system tokens
├── index.html                 # HTML entry point with metadata & fonts
└── src/
    ├── types/                 # TypeScript interfaces (User, Student, Subject, Attendance, etc.)
    ├── lib/                   # Firebase initialization (firebase.ts)
    ├── utils/
    │   ├── geo.ts             # Haversine distance calculator & browser geolocation
    │   ├── faceBiometrics.ts  # Browser-based facial vector extraction & comparison
    │   ├── attendanceCalculator.ts # Attendance % & risk prediction formulas
    │   └── exportUtils.ts     # CSV & PDF report generators
    ├── services/
    │   ├── authService.ts     # Firebase Auth login, password reset, and session handling
    │   ├── dataService.ts     # Firestore operations + local simulation fallback
    │   └── seedService.ts     # Rich initial demo dataset (students, subjects, attendance)
    ├── contexts/
    │   ├── AuthContext.tsx    # Authentication state, session persistence, role switcher
    │   └── NotificationContext.tsx # Floating toasts and real-time alert badges
    ├── components/
    │   ├── common/UIComponents.tsx # Card, StatCard, Badge, Button, Input, Modal
    │   ├── layout/            # Navbar, Sidebar, DashboardLayout
    │   ├── qr/                # QRSessionModal, QRScannerView
    │   └── attendance/        # ManualAttendanceModal
    ├── pages/
    │   ├── auth/              # LoginPage, ForgotPasswordPage
    │   ├── admin/             # AdminDashboard, Students, Faculty, Departments, Subjects, Classes, Attendance, Reports, Settings, AuditLogs
    │   ├── faculty/           # FacultyDashboard, FacultySubjects, FacultyAttendance, FacultySessions, FacultyReports
    │   └── student/           # StudentDashboard, StudentScan, StudentAttendance, StudentCalendar, StudentProfile, StudentNotifications
    ├── routes/AppRoutes.tsx   # Role-protected routing hierarchy
    ├── App.tsx
    ├── main.tsx
    └── index.css
```

---

## Quick Start & Local Development

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### 2. Installation
Clone the repository and install packages:
```bash
git clone <repository-url>
cd student-project
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to: `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```
This compiles TypeScript (`tsc`) and outputs minified static assets to `/dist`.

---

## Instant Demo Testing (Out of the Box)

SmartAttend includes pre-seeded, realistic college data so evaluators can test all three roles immediately without configuring Firebase first:

| Role | Email | Features to Test |
| :--- | :--- | :--- |
| **Admin** | `admin@smartattend.edu` | Student/faculty CRUD, charts, geofence radius settings, audit logs, PDF reports |
| **Faculty** | `faculty@smartattend.edu` | Launch dynamic QR attendance, countdown timer, manual attendance sheet, send alerts |
| **Student** | `student@smartattend.edu` | Good Morning greeting, 84.6% overall attendance, Networks 74% warning, QR camera scanner, monthly calendar |

> **Tip**: You can switch roles at any time using the quick **Admin / Faculty / Student** selector in the top navigation bar!

---

## Firebase Configuration

To connect SmartAttend to your live Firebase project:

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project** and name it (e.g. `smartattend-college`).
3. Under **Project Settings** > **General**, click **Add app** > **Web (`</>`)** and register `SmartAttend Web`.

### 2. Enable Authentication
1. Navigate to **Build** > **Authentication**.
2. Click **Get Started** and enable **Email/Password**.
3. Under **Authorized Domains**, ensure `localhost` and your Vercel domain (`*.vercel.app`) are listed.

### 3. Enable Cloud Firestore
1. Navigate to **Build** > **Firestore Database**.
2. Click **Create Database** (choose production mode and select your region).
3. Open the **Rules** tab, paste the contents of `firestore.rules`, and click **Publish**.

### 4. Enable Firebase Storage
1. Navigate to **Build** > **Storage**.
2. Click **Get Started**.
3. Open the **Rules** tab, paste the contents of `storage.rules`, and click **Publish**.

### 5. Set Environment Variables
Copy `.env.example` to `.env.local` and add your Firebase credentials:
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=smartattend-college.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smartattend-college
VITE_FIREBASE_STORAGE_BUCKET=smartattend-college.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

---

## Deployment Guide (Vercel)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: SmartAttend full-stack attendance management system"
git branch -M main
git remote add origin https://github.com/<your-username>/smartattend.git
git push -u origin main
```

### 2. Import into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project** and select your GitHub repository.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build` (or `tsc && vite build`).
5. Output Directory: `dist`.

### 3. Add Environment Variables in Vercel
Under **Project Settings** > **Environment Variables**, add:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 4. Deploy & Verify
1. Click **Deploy**. Vercel will build and deploy the SPA within 30 seconds.
2. In Firebase Console > Authentication > Settings > **Authorized Domains**, add your Vercel deployment URL (e.g. `smartattend.vercel.app`).
3. Test logging in, QR generation, mobile camera scanning, and PDF downloads.

---

## Troubleshooting

- **Camera Permission Denied**:
  Ensure the browser has permission to access the camera (`chrome://settings/content/camera`). In desktop testing without a webcam, use the built-in **"Interactive Demo QR Testing"** panel on `/student/scan` to simulate scans with one click.
- **Geolocation "Outside Permitted Radius"**:
  By default, campus coordinates are set to a demo location. In the **Admin Portal** > **Settings & Geo**, click **"Sync My Current Location"** to align the campus geofence coordinates with your device's actual GPS position.
- **Rollup native binary block on Windows**:
  SmartAttend aliases Rollup to `@rollup/wasm-node` in `vite.config.ts`, ensuring smooth builds even in environments where Windows Defender Application Control blocks `.node` binary execution.

---

## License
MIT License. Built for collegiate student attendance management.
