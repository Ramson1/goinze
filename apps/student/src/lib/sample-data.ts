// ============================================================
// Sample data for the Goinzeschool Student Portal.
// In production these are fetched from the NestJS API
// (${NEXT_PUBLIC_API_URL}) — this module powers the UI scaffold.
// ============================================================

import { computeGpa } from '@/lib/utils';

// ------------------------------------------------------------
// Student identity
// ------------------------------------------------------------
export interface StudentProfile {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  matricNo: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  religion: string;
  nationality: string;
  stateOfOrigin: string;
  lga: string;
  homeAddress: string;
  faculty: string;
  department: string;
  programme: string;
  level: string;
  session: string;
  semester: string;
  entryYear: string;
  avatarUrl: string | null;
  bloodGroup: string;
  genotype: string;
}

export const student: StudentProfile = {
  id: 'stu_01J9ZKQ3M7',
  firstName: 'Adaeze',
  middleName: 'Chidinma',
  lastName: 'Okafor',
  matricNo: 'GDU/CSC/2022/0421',
  email: 'adaeze.okafor@student.goinzeschool.com',
  phone: '+234 803 555 0142',
  gender: 'Female',
  dateOfBirth: '2004-03-18',
  religion: 'Christian',
  nationality: 'Nigerian',
  stateOfOrigin: 'Anambra',
  lga: 'Awka South',
  homeAddress: '12 Umuerim Road, Awka, Anambra State',
  faculty: 'Faculty of Physical Sciences',
  department: 'Computer Science',
  programme: 'B.Sc. Computer Science',
  level: '300 Level',
  session: '2024/2025',
  semester: 'First Semester',
  entryYear: '2022',
  avatarUrl: null,
  bloodGroup: 'O+',
  genotype: 'AA',
};

export const guardian = {
  name: 'Mr. Emeka Okafor',
  relationship: 'Father',
  phone: '+234 802 111 4478',
  email: 'emeka.okafor@gmail.com',
  occupation: 'Civil Engineer',
  address: '12 Umuerim Road, Awka, Anambra State',
};

export const medical = {
  bloodGroup: 'O+',
  genotype: 'AA',
  allergies: 'Penicillin',
  conditions: 'None known',
  emergencyName: 'Mrs. Ngozi Okafor',
  emergencyPhone: '+234 805 222 9931',
  emergencyRelation: 'Mother',
};

// ------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------
export interface GpaTrendPoint {
  semester: string;
  gpa: number;
}

export const gpaTrend: GpaTrendPoint[] = [
  { semester: '100L · 1st', gpa: 4.3 },
  { semester: '100L · 2nd', gpa: 4.42 },
  { semester: '200L · 1st', gpa: 4.55 },
  { semester: '200L · 2nd', gpa: 4.61 },
  { semester: '300L · 1st', gpa: 4.52 },
];

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  tag: 'Academic' | 'Finance' | 'General' | 'Exam';
}

export const announcements: Announcement[] = [
  {
    id: 'an_1',
    title: 'Course registration closes Friday',
    body: 'The 2024/2025 First Semester course registration window closes this Friday at 11:59 PM. Late registration attracts a penalty fee.',
    date: '2025-01-20',
    tag: 'Academic',
  },
  {
    id: 'an_2',
    title: 'Mid-semester CBT timetable released',
    body: 'The mid-semester computer based test timetable is now available. Check the CBT Dashboard for your schedule and venue.',
    date: '2025-01-18',
    tag: 'Exam',
  },
  {
    id: 'an_3',
    title: 'Outstanding fees reminder',
    body: 'Students with outstanding balances should complete payment before the end of the month to avoid restriction of results.',
    date: '2025-01-15',
    tag: 'Finance',
  },
  {
    id: 'an_4',
    title: 'Library extended hours during exams',
    body: 'The e-Library will remain open until 10 PM on weekdays throughout the examination period.',
    date: '2025-01-12',
    tag: 'General',
  },
];

// ------------------------------------------------------------
// Courses
// ------------------------------------------------------------
export interface Course {
  code: string;
  title: string;
  units: number;
  lecturer: string;
  semester: string;
  isCore: boolean;
  status?: 'Registered' | 'Approved' | 'Pending';
}

export const availableCourses: Course[] = [
  { code: 'CSC 301', title: 'Data Structures & Algorithms', units: 3, lecturer: 'Dr. K. Adeyemi', semester: 'First', isCore: true },
  { code: 'CSC 303', title: 'Operating Systems', units: 3, lecturer: 'Prof. F. Eze', semester: 'First', isCore: true },
  { code: 'CSC 305', title: 'Database Management Systems', units: 3, lecturer: 'Dr. L. Bakare', semester: 'First', isCore: true },
  { code: 'CSC 307', title: 'Computer Networks', units: 2, lecturer: 'Engr. T. Okon', semester: 'First', isCore: true },
  { code: 'CSC 309', title: 'Web Application Development', units: 3, lecturer: 'Dr. S. Mohammed', semester: 'First', isCore: false },
  { code: 'CSC 311', title: 'Discrete Structures II', units: 2, lecturer: 'Dr. P. Nwosu', semester: 'First', isCore: true },
  { code: 'MTH 301', title: 'Numerical Analysis I', units: 3, lecturer: 'Prof. G. Danladi', semester: 'First', isCore: false },
  { code: 'STA 305', title: 'Probability for Scientists', units: 3, lecturer: 'Dr. R. Yusuf', semester: 'First', isCore: false },
  { code: 'GNS 301', title: 'Entrepreneurship Studies I', units: 2, lecturer: 'Dr. B. Chukwu', semester: 'First', isCore: true },
  { code: 'PHY 303', title: 'Electronics I', units: 3, lecturer: 'Dr. A. Salami', semester: 'First', isCore: false },
];

export const registeredCourses: Course[] = [
  { code: 'CSC 301', title: 'Data Structures & Algorithms', units: 3, lecturer: 'Dr. K. Adeyemi', semester: 'First', isCore: true, status: 'Approved' },
  { code: 'CSC 303', title: 'Operating Systems', units: 3, lecturer: 'Prof. F. Eze', semester: 'First', isCore: true, status: 'Approved' },
  { code: 'CSC 305', title: 'Database Management Systems', units: 3, lecturer: 'Dr. L. Bakare', semester: 'First', isCore: true, status: 'Approved' },
  { code: 'CSC 307', title: 'Computer Networks', units: 2, lecturer: 'Engr. T. Okon', semester: 'First', isCore: true, status: 'Approved' },
  { code: 'CSC 309', title: 'Web Application Development', units: 3, lecturer: 'Dr. S. Mohammed', semester: 'First', isCore: false, status: 'Approved' },
  { code: 'CSC 311', title: 'Discrete Structures II', units: 2, lecturer: 'Dr. P. Nwosu', semester: 'First', isCore: true, status: 'Approved' },
  { code: 'GNS 301', title: 'Entrepreneurship Studies I', units: 2, lecturer: 'Dr. B. Chukwu', semester: 'First', isCore: true, status: 'Approved' },
  { code: 'STA 305', title: 'Probability for Scientists', units: 3, lecturer: 'Dr. R. Yusuf', semester: 'First', isCore: false, status: 'Pending' },
];

export const registrationWindow = {
  open: '2025-01-06',
  close: '2025-01-31',
  locked: false,
  maxUnits: 24,
  minUnits: 15,
};

// ------------------------------------------------------------
// Finance
// ------------------------------------------------------------
export type FeeStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface FeeItem {
  id: string;
  description: string;
  amount: number;
  status: FeeStatus;
  dueDate: string;
  ref: string;
}

export const feeItems: FeeItem[] = [
  { id: 'fee_1', description: 'Tuition Fee (First Semester)', amount: 185000, status: 'PAID', dueDate: '2024-11-15', ref: 'GIS-PAY-20241110-8F3K1Q' },
  { id: 'fee_2', description: 'Departmental Dues', amount: 15000, status: 'PAID', dueDate: '2024-11-15', ref: 'GIS-PAY-20241110-2M9X4T' },
  { id: 'fee_3', description: 'ICT / Portal Levy', amount: 10000, status: 'PAID', dueDate: '2024-11-20', ref: 'GIS-PAY-20241118-7Q2L8N' },
  { id: 'fee_4', description: 'Examination Fee', amount: 25000, status: 'PENDING', dueDate: '2025-02-10', ref: 'GIS-PAY-20250120-5W6R3J' },
  { id: 'fee_5', description: 'Laboratory / Practicum Fee', amount: 12000, status: 'PENDING', dueDate: '2025-02-10', ref: 'GIS-PAY-20250120-1C8V5H' },
  { id: 'fee_6', description: 'ID Card Replacement (optional)', amount: 5000, status: 'OVERDUE', dueDate: '2025-01-10', ref: 'GIS-PAY-20250102-9D4B7P' },
];

export interface Receipt {
  id: string;
  receiptNo: string;
  description: string;
  amount: number;
  date: string;
  method: string;
  verificationCode: string;
  status: 'SUCCESS' | 'PROCESSING';
}

export const receipts: Receipt[] = [
  { id: 'rc_1', receiptNo: 'RCP-20241110-004213', description: 'Tuition Fee (First Semester)', amount: 185000, date: '2024-11-10', method: 'Flutterwave · Card', verificationCode: '7K2P-9QX4', status: 'SUCCESS' },
  { id: 'rc_2', receiptNo: 'RCP-20241110-004214', description: 'Departmental Dues', amount: 15000, date: '2024-11-10', method: 'Flutterwave · Card', verificationCode: '3M8N-6TR1', status: 'SUCCESS' },
  { id: 'rc_3', receiptNo: 'RCP-20241118-004390', description: 'ICT / Portal Levy', amount: 10000, date: '2024-11-18', method: 'Flutterwave · Transfer', verificationCode: '9W4L-2KJ7', status: 'SUCCESS' },
  { id: 'rc_4', receiptNo: 'RCP-20240912-003871', description: 'Acceptance Fee (Admission)', amount: 60000, date: '2024-09-12', method: 'Flutterwave · Card', verificationCode: '5B6V-8HC3', status: 'SUCCESS' },
];

// ------------------------------------------------------------
// Results
// ------------------------------------------------------------
export interface ResultCourse {
  code: string;
  title: string;
  units: number;
  score: number;
}

export interface SemesterResult {
  id: string;
  session: string;
  semester: 'First' | 'Second';
  level: string;
  courses: ResultCourse[];
}

export const semesterResults: SemesterResult[] = [
  {
    id: 'sem_1',
    session: '2022/2023',
    semester: 'First',
    level: '100 Level',
    courses: [
      { code: 'CSC 101', title: 'Introduction to Computer Science', units: 3, score: 78 },
      { code: 'CSC 103', title: 'Programming Fundamentals I', units: 3, score: 72 },
      { code: 'MTH 101', title: 'General Mathematics I', units: 3, score: 66 },
      { code: 'PHY 101', title: 'Mechanics & Properties of Matter', units: 3, score: 61 },
      { code: 'GNS 101', title: 'Communication Skills I', units: 2, score: 82 },
      { code: 'CHM 101', title: 'General Chemistry I', units: 3, score: 58 },
    ],
  },
  {
    id: 'sem_2',
    session: '2022/2023',
    semester: 'Second',
    level: '100 Level',
    courses: [
      { code: 'CSC 102', title: 'Introduction to Problem Solving', units: 3, score: 80 },
      { code: 'CSC 104', title: 'Programming Fundamentals II', units: 3, score: 75 },
      { code: 'MTH 102', title: 'General Mathematics II', units: 3, score: 68 },
      { code: 'STA 102', title: 'Descriptive Statistics', units: 3, score: 70 },
      { code: 'GNS 102', title: 'Communication Skills II', units: 2, score: 84 },
      { code: 'PHY 102', title: 'Electricity & Magnetism', units: 3, score: 62 },
    ],
  },
  {
    id: 'sem_3',
    session: '2023/2024',
    semester: 'First',
    level: '200 Level',
    courses: [
      { code: 'CSC 201', title: 'Computer Architecture', units: 3, score: 85 },
      { code: 'CSC 203', title: 'Object Oriented Programming', units: 3, score: 79 },
      { code: 'CSC 205', title: 'Discrete Structures I', units: 2, score: 74 },
      { code: 'MTH 201', title: 'Mathematical Methods I', units: 3, score: 67 },
      { code: 'STA 201', title: 'Probability I', units: 3, score: 71 },
      { code: 'GNS 201', title: 'Nigerian Peoples & Culture', units: 2, score: 88 },
    ],
  },
  {
    id: 'sem_4',
    session: '2023/2024',
    semester: 'Second',
    level: '200 Level',
    courses: [
      { code: 'CSC 202', title: 'Assembly Language Programming', units: 3, score: 83 },
      { code: 'CSC 204', title: 'File Processing & Organisation', units: 3, score: 81 },
      { code: 'CSC 206', title: 'Statistical Programming', units: 2, score: 77 },
      { code: 'MTH 202', title: 'Mathematical Methods II', units: 3, score: 69 },
      { code: 'STA 202', title: 'Probability II', units: 3, score: 73 },
      { code: 'GNS 202', title: 'Peace & Conflict Resolution', units: 2, score: 90 },
    ],
  },
  {
    id: 'sem_5',
    session: '2024/2025',
    semester: 'First',
    level: '300 Level',
    courses: [
      { code: 'CSC 301', title: 'Data Structures & Algorithms', units: 3, score: 76 },
      { code: 'CSC 303', title: 'Operating Systems', units: 3, score: 71 },
      { code: 'CSC 305', title: 'Database Management Systems', units: 3, score: 82 },
      { code: 'CSC 307', title: 'Computer Networks', units: 2, score: 68 },
      { code: 'CSC 311', title: 'Discrete Structures II', units: 2, score: 74 },
      { code: 'GNS 301', title: 'Entrepreneurship Studies I', units: 2, score: 86 },
    ],
  },
];

/** Compute the GPA for a single semester result. */
export function semesterGpa(result: SemesterResult) {
  return computeGpa(
    result.courses.map((c) => ({ creditUnits: c.units, score: c.score })),
  );
}

/** Cumulative GPA across all released semesters. */
export function cumulativeGpa() {
  const all = semesterResults.flatMap((s) =>
    s.courses.map((c) => ({ creditUnits: c.units, score: c.score })),
  );
  return computeGpa(all);
}

// ------------------------------------------------------------
// Academic calendar
// ------------------------------------------------------------
export type CalendarEventType =
  | 'Resumption'
  | 'Academic'
  | 'Exam'
  | 'Break'
  | 'Ceremony'
  | 'Deadline';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  type: CalendarEventType;
  description: string;
}

export const academicCalendar: CalendarEvent[] = [
  { id: 'ev_1', title: 'Resumption & Registration', startDate: '2024-10-21', endDate: '2024-11-01', type: 'Resumption', description: 'Students resume; course registration and fee payment window opens.' },
  { id: 'ev_2', title: 'Lectures Begin (First Semester)', startDate: '2024-11-04', type: 'Academic', description: 'First semester lectures commence across all faculties.' },
  { id: 'ev_3', title: 'Mid-Semester CBT Tests', startDate: '2024-12-09', endDate: '2024-12-13', type: 'Exam', description: 'Computer based mid-semester tests for all courses.' },
  { id: 'ev_4', title: 'Christmas Break', startDate: '2024-12-20', endDate: '2025-01-05', type: 'Break', description: 'Mid-session break. No lectures or examinations.' },
  { id: 'ev_5', title: 'Course Registration Deadline', startDate: '2025-01-31', type: 'Deadline', description: 'Last day to register courses without penalty.' },
  { id: 'ev_6', title: 'First Semester Examinations', startDate: '2025-02-17', endDate: '2025-03-01', type: 'Exam', description: 'End of first semester examinations.' },
  { id: 'ev_7', title: 'First Semester Ends', startDate: '2025-03-07', type: 'Academic', description: 'First semester officially ends; results processing begins.' },
  { id: 'ev_8', title: 'Second Semester Begins', startDate: '2025-03-17', type: 'Academic', description: 'Second semester lectures commence.' },
  { id: 'ev_9', title: 'Matriculation Ceremony', startDate: '2025-04-11', type: 'Ceremony', description: 'Matriculation of fresh students at the main auditorium.' },
  { id: 'ev_10', title: 'Second Semester Examinations', startDate: '2025-06-16', endDate: '2025-06-28', type: 'Exam', description: 'End of second semester examinations.' },
  { id: 'ev_11', title: 'Convocation Ceremony', startDate: '2025-08-08', type: 'Ceremony', description: 'Annual convocation and award of degrees.' },
];

// ------------------------------------------------------------
// CBT
// ------------------------------------------------------------
export type ExamStatus = 'available' | 'upcoming' | 'completed';

export interface CbtExam {
  id: string;
  courseCode: string;
  title: string;
  course: string;
  durationMinutes: number;
  totalQuestions: number;
  status: ExamStatus;
  startDate: string;
  startTime: string;
  venue: string;
  instructions: string;
}

export const cbtExams: CbtExam[] = [
  {
    id: 'exam_csc301',
    courseCode: 'CSC 301',
    title: 'Mid-Semester Test — Data Structures & Algorithms',
    course: 'Data Structures & Algorithms',
    durationMinutes: 30,
    totalQuestions: 20,
    status: 'available',
    startDate: '2025-01-22',
    startTime: '10:00 AM',
    venue: 'e-Learning Hall B',
    instructions: 'Answer all questions. Each question carries equal marks. Do not refresh the browser during the exam.',
  },
  {
    id: 'exam_csc305',
    courseCode: 'CSC 305',
    title: 'Mid-Semester Test — Database Management Systems',
    course: 'Database Management Systems',
    durationMinutes: 30,
    totalQuestions: 20,
    status: 'available',
    startDate: '2025-01-22',
    startTime: '12:00 PM',
    venue: 'e-Learning Hall A',
    instructions: 'SQL and normalization questions included. Ensure a stable internet connection.',
  },
  {
    id: 'exam_csc303',
    courseCode: 'CSC 303',
    title: 'Mid-Semester Test — Operating Systems',
    course: 'Operating Systems',
    durationMinutes: 25,
    totalQuestions: 15,
    status: 'upcoming',
    startDate: '2025-01-24',
    startTime: '09:00 AM',
    venue: 'e-Learning Hall C',
    instructions: 'Covers process management and memory management modules.',
  },
  {
    id: 'exam_gns301',
    courseCode: 'GNS 301',
    title: 'Mid-Semester Test — Entrepreneurship Studies I',
    course: 'Entrepreneurship Studies I',
    durationMinutes: 20,
    totalQuestions: 15,
    status: 'upcoming',
    startDate: '2025-01-25',
    startTime: '11:00 AM',
    venue: 'Main Auditorium',
    instructions: 'Bring your student ID card. The exam starts promptly.',
  },
  {
    id: 'exam_csc307',
    courseCode: 'CSC 307',
    title: 'Mid-Semester Test — Computer Networks',
    course: 'Computer Networks',
    durationMinutes: 25,
    totalQuestions: 15,
    status: 'completed',
    startDate: '2025-01-15',
    startTime: '10:00 AM',
    venue: 'e-Learning Hall B',
    instructions: 'Completed. Score has been released.',
  },
];

export interface CbtQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export const sampleQuestions: CbtQuestion[] = [
  {
    id: 'q1',
    question: 'Which data structure operates on the FIFO (First-In-First-Out) principle?',
    options: ['Stack', 'Queue', 'Binary Tree', 'Graph'],
    correctIndex: 1,
  },
  {
    id: 'q2',
    question: 'What is the average time complexity of binary search on a sorted array?',
    options: ['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'],
    correctIndex: 2,
  },
  {
    id: 'q3',
    question: 'Which of the following is NOT a linear data structure?',
    options: ['Array', 'Linked List', 'Stack', 'Binary Tree'],
    correctIndex: 3,
  },
  {
    id: 'q4',
    question: 'In a singly linked list, each node contains a data field and a pointer to the:',
    options: ['Previous node', 'Next node', 'Head node only', 'Root node'],
    correctIndex: 1,
  },
  {
    id: 'q5',
    question: 'Which sorting algorithm has the best average-case time complexity?',
    options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'],
    correctIndex: 2,
  },
  {
    id: 'q6',
    question: 'A stack follows which principle?',
    options: ['FIFO', 'LIFO', 'LILO', 'Random access'],
    correctIndex: 1,
  },
  {
    id: 'q7',
    question: 'Which operation removes an element from the front of a queue?',
    options: ['Push', 'Pop', 'Enqueue', 'Dequeue'],
    correctIndex: 3,
  },
  {
    id: 'q8',
    question: 'The height of a balanced binary search tree with n nodes is approximately:',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
    correctIndex: 1,
  },
  {
    id: 'q9',
    question: 'Which traversal of a BST yields the elements in sorted order?',
    options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'],
    correctIndex: 2,
  },
  {
    id: 'q10',
    question: 'A hash table is primarily used for:',
    options: ['Sorting', 'Fast lookup', 'Graph traversal', 'Compression'],
    correctIndex: 1,
  },
];

// ------------------------------------------------------------
// Notifications / Messages / Articles / Downloads / Alumni
// ------------------------------------------------------------
export interface Notification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export const notifications: Notification[] = [
  { id: 'nt_1', title: 'Result released', body: 'Your 2024/2025 First Semester result has been released. View it under Results.', date: '2025-01-21', read: false, type: 'success' },
  { id: 'nt_2', title: 'Payment successful', body: 'Your payment of ₦10,000 for ICT / Portal Levy was successful. Receipt available for download.', date: '2025-01-18', read: false, type: 'success' },
  { id: 'nt_3', title: 'CBT exam scheduled', body: 'CSC 301 mid-semester test is scheduled for Jan 22, 10:00 AM at e-Learning Hall B.', date: '2025-01-17', read: true, type: 'info' },
  { id: 'nt_4', title: 'Outstanding balance', body: 'You have an outstanding balance of ₦42,000. Please pay before Feb 10 to avoid restrictions.', date: '2025-01-15', read: true, type: 'warning' },
  { id: 'nt_5', title: 'Course registration approved', body: 'Your course registration for 2024/2025 First Semester has been approved by your course adviser.', date: '2025-01-12', read: true, type: 'success' },
];

export interface Message {
  id: string;
  from: string;
  role: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
}

export const messages: Message[] = [
  { id: 'ms_1', from: 'Dr. K. Adeyemi', role: 'Course Adviser', subject: 'Registration approved', body: 'Hi Adaeze, I have approved your course registration for the semester. Keep up the good work and remember to attend all lectures.', date: '2025-01-20', read: false },
  { id: 'ms_2', from: 'Departmental Office', role: 'Computer Science', subject: 'Project topic submission', body: 'All 300-level students should submit their proposed project topics to the departmental office before the end of the month.', date: '2025-01-18', read: false },
  { id: 'ms_3', from: 'Bursary Department', role: 'Finance', subject: 'Fee payment reminder', body: 'This is a reminder that examination fees are due on or before February 10. Payments are made via the portal.', date: '2025-01-15', read: true },
  { id: 'ms_4', from: 'Prof. F. Eze', role: 'Lecturer, CSC 303', subject: 'Extra class on Friday', body: 'There will be an extra class on Friday 2 PM to cover scheduling algorithms ahead of the mid-semester test.', date: '2025-01-13', read: true },
];

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
}

export const articles: Article[] = [
  { id: 'ar_1', title: 'How to prepare for your first CBT exam', excerpt: 'Computer based tests can feel different from paper exams. Here are practical tips to stay calm, manage time and avoid technical issues on exam day.', author: 'ICT Directorate', date: '2025-01-19', category: 'Guides', readTime: '5 min' },
  { id: 'ar_2', title: 'Understanding your GPA and CGPA', excerpt: 'A clear breakdown of the 5-point grading scale, how GPA is computed each semester, and what your CGPA classification means for graduation.', author: 'Academic Affairs', date: '2025-01-14', category: 'Academics', readTime: '4 min' },
  { id: 'ar_3', title: 'Scholarships and bursaries for 2025', excerpt: 'The university and several external bodies are offering scholarships. Check the eligibility criteria and application deadlines here.', author: 'Student Affairs', date: '2025-01-10', category: 'Opportunities', readTime: '6 min' },
  { id: 'ar_4', title: 'Staying safe on campus: a student guide', excerpt: 'From securing your belongings to reporting incidents, this guide covers the essentials of personal safety on and around campus.', author: 'Security Unit', date: '2025-01-06', category: 'Campus Life', readTime: '3 min' },
  { id: 'ar_5', title: 'Career paths for Computer Science graduates', excerpt: 'Software engineering, data science, cybersecurity and more — a look at where CSC graduates are building careers and the skills that matter.', author: 'Career Centre', date: '2024-12-18', category: 'Careers', readTime: '7 min' },
];

export interface DownloadItem {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'XLSX';
  size: string;
  date: string;
  category: string;
}

export const downloads: DownloadItem[] = [
  { id: 'dl_1', name: '2024/2025 Academic Calendar', type: 'PDF', size: '420 KB', date: '2025-01-05', category: 'Academic' },
  { id: 'dl_2', name: 'First Semester Exam Timetable', type: 'PDF', size: '310 KB', date: '2025-01-18', category: 'Exams' },
  { id: 'dl_3', name: 'Course Registration Form', type: 'PDF', size: '180 KB', date: '2025-01-08', category: 'Registration' },
  { id: 'dl_4', name: 'Student Handbook 2024', type: 'PDF', size: '2.4 MB', date: '2024-11-02', category: 'General' },
  { id: 'dl_5', name: 'Project Topic Guidelines', type: 'DOCX', size: '95 KB', date: '2025-01-12', category: 'Academic' },
  { id: 'dl_6', name: 'Fee Schedule 2024/2025', type: 'XLSX', size: '60 KB', date: '2024-10-25', category: 'Finance' },
];

export interface Alumni {
  id: string;
  name: string;
  graduationYear: string;
  programme: string;
  currentRole: string;
  company: string;
  story: string;
}

export const alumni: Alumni[] = [
  { id: 'al_1', name: 'Chinedu Obi', graduationYear: '2025', programme: 'B.Sc. Computer Science', currentRole: 'Senior Software Engineer', company: 'Paystack', story: 'Chinedu started as a teaching assistant and now leads a payments engineering team. He mentors final-year students every summer.' },
  { id: 'al_2', name: 'Fatima Bello', graduationYear: '2025', programme: 'B.Sc. Computer Science', currentRole: 'Data Scientist', company: 'Flutterwave', story: 'Fatima discovered data science through a departmental workshop and now builds fraud detection models used across Africa.' },
  { id: 'al_3', name: 'Tunde Adebayo', graduationYear: '2026', programme: 'B.Sc. Computer Science', currentRole: 'Founder & CEO', company: 'Klassroom (EdTech startup)', story: 'Tunde founded an edtech startup during NYSC and has raised seed funding to expand across three countries.' },
  { id: 'al_4', name: 'Grace Nwachukwu', graduationYear: '2026', programme: 'B.Sc. Computer Science', currentRole: 'Security Analyst', company: 'Deloitte', story: 'Grace specialised in cybersecurity and now helps enterprises defend against emerging threats.' },
];
