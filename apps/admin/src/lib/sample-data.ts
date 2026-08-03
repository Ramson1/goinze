// ============================================================
// Sample data for the Goinzeschool Admin Portal.
// These are realistic, self-contained fixtures used to render the
// UI before the NestJS API is wired in. Replace with API calls later.
// ============================================================

// ---- People ----
export interface Student {
  id: string;
  matricNo: string;
  name: string;
  email: string;
  department: string;
  level: string;
  gpa: number;
  status: string;
}

export const students: Student[] = [
  { id: 's1', matricNo: 'GDU/CSC/2023/0142', name: 'Adaeze Okonkwo', email: 'adaeze.okonkwo@stu.gdu.edu.ng', department: 'Computer Science', level: '300', gpa: 4.62, status: 'Active' },
  { id: 's2', matricNo: 'GDU/CSC/2024/0311', name: 'Tunde Bakare', email: 'tunde.bakare@stu.gdu.edu.ng', department: 'Computer Science', level: '200', gpa: 3.81, status: 'Active' },
  { id: 's3', matricNo: 'GDU/ACC/2022/0078', name: 'Chiamaka Eze', email: 'chiamaka.eze@stu.gdu.edu.ng', department: 'Accountancy', level: '400', gpa: 4.24, status: 'Active' },
  { id: 's4', matricNo: 'GDU/MCB/2023/0205', name: 'Ibrahim Musa', email: 'ibrahim.musa@stu.gdu.edu.ng', department: 'Microbiology', level: '300', gpa: 3.44, status: 'Active' },
  { id: 's5', matricNo: 'GDU/LAW/2024/0119', name: 'Folake Adeyemi', email: 'folake.adeyemi@stu.gdu.edu.ng', department: 'Law', level: '200', gpa: 4.05, status: 'Active' },
  { id: 's6', matricNo: 'GDU/EEE/2021/0033', name: 'Emeka Obi', email: 'emeka.obi@stu.gdu.edu.ng', department: 'Electrical Engineering', level: '500', gpa: 2.98, status: 'Probation' },
  { id: 's7', matricNo: 'GDU/NUR/2023/0260', name: 'Halima Bello', email: 'halima.bello@stu.gdu.edu.ng', department: 'Nursing Science', level: '300', gpa: 4.41, status: 'Active' },
  { id: 's8', matricNo: 'GDU/ECO/2022/0154', name: 'Yusuf Danladi', email: 'yusuf.danladi@stu.gdu.edu.ng', department: 'Economics', level: '400', gpa: 3.12, status: 'Active' },
  { id: 's9', matricNo: 'GDU/BCH/2024/0402', name: 'Ngozi Nwosu', email: 'ngozi.nwosu@stu.gdu.edu.ng', department: 'Biochemistry', level: '200', gpa: 3.67, status: 'Active' },
  { id: 's10', matricNo: 'GDU/MAS/2021/0021', name: 'Segun Alabi', email: 'segun.alabi@stu.gdu.edu.ng', department: 'Mass Communication', level: '500', gpa: 1.87, status: 'Inactive' },
];

// ---- Admissions ----
export interface Application {
  id: string;
  appNo: string;
  name: string;
  program: string;
  department: string;
  date: string;
  status: string;
}

export const applications: Application[] = [
  { id: 'a1', appNo: 'APP/2025/0004213', name: 'Blessing Okafor', program: 'B.Sc. Computer Science', department: 'Computer Science', date: '2025-07-02', status: 'Under Review' },
  { id: 'a2', appNo: 'APP/2025/0004198', name: 'Kunle Ajayi', program: 'B.A. Economics', department: 'Economics', date: '2025-07-01', status: 'Interview' },
  { id: 'a3', appNo: 'APP/2025/0004187', name: 'Amina Suleiman', program: 'B.NSc. Nursing', department: 'Nursing Science', date: '2025-06-28', status: 'Approved' },
  { id: 'a4', appNo: 'APP/2025/0004170', name: 'David Okoro', program: 'LL.B. Law', department: 'Law', date: '2025-06-27', status: 'Submitted' },
  { id: 'a5', appNo: 'APP/2025/0004166', name: 'Grace Adamu', program: 'B.Eng. Civil Engineering', department: 'Civil Engineering', date: '2025-06-25', status: 'Admitted' },
  { id: 'a6', appNo: 'APP/2025/0004150', name: 'Musa Garba', program: 'B.Sc. Microbiology', department: 'Microbiology', date: '2025-06-24', status: 'Rejected' },
  { id: 'a7', appNo: 'APP/2025/0004141', name: 'Ifeoma Uche', program: 'B.Sc. Accounting', department: 'Accountancy', date: '2025-06-22', status: 'Under Review' },
  { id: 'a8', appNo: 'APP/2025/0004133', name: 'Samuel Johnson', program: 'B.Eng. Electrical Engineering', department: 'Electrical Engineering', date: '2025-06-20', status: 'Approved' },
];

// ---- Staff ----
export interface Staff {
  id: string;
  staffNo: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
}

export const staff: Staff[] = [
  { id: 'st1', staffNo: 'GDU/STAFF/001', name: 'Prof. Adaobi Nnamdi', email: 'adaobi.nnamdi@gdu.edu.ng', role: 'Head of Department', department: 'Computer Science', status: 'Active' },
  { id: 'st2', staffNo: 'GDU/STAFF/014', name: 'Dr. Femi Olawale', email: 'femi.olawale@gdu.edu.ng', role: 'Senior Lecturer', department: 'Economics', status: 'Active' },
  { id: 'st3', staffNo: 'GDU/STAFF/022', name: 'Mrs. Kemi Adeleke', email: 'kemi.adeleke@gdu.edu.ng', role: 'Accountant', department: 'Finance', status: 'Active' },
  { id: 'st4', staffNo: 'GDU/STAFF/031', name: 'Mr. Chinedu Okeke', email: 'chinedu.okeke@gdu.edu.ng', role: 'Lecturer I', department: 'Microbiology', status: 'Active' },
  { id: 'st5', staffNo: 'GDU/STAFF/045', name: 'Dr. Hauwa Mohammed', email: 'hauwa.mohammed@gdu.edu.ng', role: 'Lecturer II', department: 'Law', status: 'On Leave' },
  { id: 'st6', staffNo: 'GDU/STAFF/052', name: 'Engr. Bola Ige', email: 'bola.ige@gdu.edu.ng', role: 'Lecturer I', department: 'Electrical Engineering', status: 'Active' },
  { id: 'st7', staffNo: 'GDU/STAFF/060', name: 'Ms. Amaka Eneh', email: 'amaka.eneh@gdu.edu.ng', role: 'Admission Officer', department: 'Admissions', status: 'Active' },
  { id: 'st8', staffNo: 'GDU/STAFF/071', name: 'Mr. Tanimu Rabiu', email: 'tanimu.rabiu@gdu.edu.ng', role: 'Registrar', department: 'Administration', status: 'Active' },
];

// ---- Academics ----
export interface Department {
  id: string;
  name: string;
  code: string;
  faculty: string;
  head: string;
  students: number;
  staff: number;
}

export const departments: Department[] = [
  { id: 'd1', name: 'Computer Science', code: 'CSC', faculty: 'Science & Technology', head: 'Prof. Adaobi Nnamdi', students: 812, staff: 24 },
  { id: 'd2', name: 'Accountancy', code: 'ACC', faculty: 'Management Sciences', head: 'Prof. Lekan Fashola', students: 655, staff: 18 },
  { id: 'd3', name: 'Microbiology', code: 'MCB', faculty: 'Science & Technology', head: 'Dr. Chinedu Okeke', students: 431, staff: 15 },
  { id: 'd4', name: 'Law', code: 'LAW', faculty: 'Law', head: 'Prof. Sani Bello', students: 388, staff: 16 },
  { id: 'd5', name: 'Electrical Engineering', code: 'EEE', faculty: 'Engineering', head: 'Engr. Bola Ige', students: 502, staff: 20 },
  { id: 'd6', name: 'Nursing Science', code: 'NUR', faculty: 'Health Sciences', head: 'Dr. Funmi Adesina', students: 340, staff: 14 },
  { id: 'd7', name: 'Economics', code: 'ECO', faculty: 'Management Sciences', head: 'Dr. Femi Olawale', students: 587, staff: 17 },
  { id: 'd8', name: 'Biochemistry', code: 'BCH', faculty: 'Science & Technology', head: 'Prof. Ifeanyi Ubah', students: 402, staff: 13 },
];

export interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
  units: number;
  level: string;
  semester: string;
  status: string;
}

export const courses: Course[] = [
  { id: 'c1', code: 'CSC 301', title: 'Data Structures & Algorithms', department: 'Computer Science', units: 3, level: '300', semester: 'First', status: 'Active' },
  { id: 'c2', code: 'CSC 305', title: 'Operating Systems', department: 'Computer Science', units: 3, level: '300', semester: 'First', status: 'Active' },
  { id: 'c3', code: 'ACC 202', title: 'Financial Accounting II', department: 'Accountancy', units: 3, level: '200', semester: 'Second', status: 'Active' },
  { id: 'c4', code: 'MCB 304', title: 'Microbial Genetics', department: 'Microbiology', units: 2, level: '300', semester: 'First', status: 'Active' },
  { id: 'c5', code: 'LAW 201', title: 'Law of Contract', department: 'Law', units: 3, level: '200', semester: 'First', status: 'Active' },
  { id: 'c6', code: 'EEE 402', title: 'Power Systems Analysis', department: 'Electrical Engineering', units: 3, level: '400', semester: 'Second', status: 'Active' },
  { id: 'c7', code: 'ECO 204', title: 'Microeconomic Theory', department: 'Economics', units: 3, level: '200', semester: 'First', status: 'Active' },
  { id: 'c8', code: 'GST 111', title: 'Communication Skills', department: 'General Studies', units: 2, level: '100', semester: 'First', status: 'Active' },
  { id: 'c9', code: 'NUR 306', title: 'Medical-Surgical Nursing', department: 'Nursing Science', units: 3, level: '300', semester: 'Second', status: 'Draft' },
];

export interface AcademicSession {
  id: string;
  session: string;
  semester: string;
  start: string;
  end: string;
  status: string;
}

export const academicSessions: AcademicSession[] = [
  { id: 'as1', session: '2024/2025', semester: 'Second Semester', start: '2025-01-13', end: '2025-05-30', status: 'In Session' },
  { id: 'as2', session: '2024/2025', semester: 'First Semester', start: '2024-09-16', end: '2024-12-20', status: 'Completed' },
  { id: 'as3', session: '2023/2024', semester: 'Third Semester (Summer)', start: '2024-07-01', end: '2024-08-23', status: 'Completed' },
  { id: 'as4', session: '2025/2026', semester: 'First Semester', start: '2025-09-15', end: '2025-12-19', status: 'Scheduled' },
];

// ---- Finance ----
export interface Payment {
  id: string;
  ref: string;
  student: string;
  description: string;
  amount: number;
  date: string;
  method: string;
  status: string;
}

export const payments: Payment[] = [
  { id: 'p1', ref: 'GIS-PAY-20250724-8F3K1Q', student: 'Adaeze Okonkwo', description: '2024/2025 Second Semester Tuition', amount: 285000, date: '2025-07-24', method: 'Card', status: 'Success' },
  { id: 'p2', ref: 'GIS-PAY-20250723-2N9D4Z', student: 'Tunde Bakare', description: 'Departmental Dues', amount: 18500, date: '2025-07-23', method: 'Bank Transfer', status: 'Success' },
  { id: 'p3', ref: 'GIS-PAY-20250723-5T7W2B', student: 'Chiamaka Eze', description: '2024/2025 Second Semester Tuition', amount: 265000, date: '2025-07-23', method: 'USSD', status: 'Pending' },
  { id: 'p4', ref: 'GIS-PAY-20250722-1Q6M8V', student: 'Ibrahim Musa', description: 'Hostel Accommodation', amount: 120000, date: '2025-07-22', method: 'Card', status: 'Success' },
  { id: 'p5', ref: 'GIS-PAY-20250722-9K3P5X', student: 'Folake Adeyemi', description: 'Acceptance Fee', amount: 95000, date: '2025-07-22', method: 'Bank Transfer', status: 'Success' },
  { id: 'p6', ref: 'GIS-PAY-20250721-4R8L2C', student: 'Emeka Obi', description: '2024/2025 Second Semester Tuition', amount: 310000, date: '2025-07-21', method: 'Card', status: 'Failed' },
  { id: 'p7', ref: 'GIS-PAY-20250721-7J5S9A', student: 'Halima Bello', description: 'Laboratory & Practicum Fees', amount: 42000, date: '2025-07-21', method: 'USSD', status: 'Success' },
  { id: 'p8', ref: 'GIS-PAY-20250720-3H2F6D', student: 'Yusuf Danladi', description: '2024/2025 Second Semester Tuition', amount: 240000, date: '2025-07-20', method: 'Bank Transfer', status: 'Success' },
  { id: 'p9', ref: 'GIS-PAY-20250719-6G4T1N', student: 'Ngozi Nwosu', description: 'Matriculation Fee', amount: 25000, date: '2025-07-19', method: 'Card', status: 'Success' },
  { id: 'p10', ref: 'GIS-PAY-20250718-8B7Y3E', student: 'Segun Alabi', description: '2024/2025 Second Semester Tuition', amount: 255000, date: '2025-07-18', method: 'Bank Transfer', status: 'Refunded' },
];

// ---- Assessment ----
export interface ResultRow {
  id: string;
  student: string;
  matricNo: string;
  course: string;
  score: number;
  grade: string;
  point: number;
  status: string;
}

export const results: ResultRow[] = [
  { id: 'r1', student: 'Adaeze Okonkwo', matricNo: 'GDU/CSC/2023/0142', course: 'CSC 301 — Data Structures', score: 82, grade: 'A', point: 5, status: 'Published' },
  { id: 'r2', student: 'Tunde Bakare', matricNo: 'GDU/CSC/2024/0311', course: 'CSC 301 — Data Structures', score: 68, grade: 'B', point: 4, status: 'Published' },
  { id: 'r3', student: 'Chiamaka Eze', matricNo: 'GDU/ACC/2022/0078', course: 'ACC 402 — Advanced Financial Reporting', score: 75, grade: 'A', point: 5, status: 'Approved' },
  { id: 'r4', student: 'Ibrahim Musa', matricNo: 'GDU/MCB/2023/0205', course: 'MCB 304 — Microbial Genetics', score: 57, grade: 'C', point: 3, status: 'Pending' },
  { id: 'r5', student: 'Folake Adeyemi', matricNo: 'GDU/LAW/2024/0119', course: 'LAW 201 — Law of Contract', score: 71, grade: 'A', point: 5, status: 'Approved' },
  { id: 'r6', student: 'Emeka Obi', matricNo: 'GDU/EEE/2021/0033', course: 'EEE 502 — Control Systems', score: 43, grade: 'E', point: 1, status: 'Pending' },
  { id: 'r7', student: 'Halima Bello', matricNo: 'GDU/NUR/2023/0260', course: 'NUR 306 — Medical-Surgical Nursing', score: 78, grade: 'A', point: 5, status: 'Published' },
  { id: 'r8', student: 'Yusuf Danladi', matricNo: 'GDU/ECO/2022/0154', course: 'ECO 404 — Monetary Economics', score: 38, grade: 'F', point: 0, status: 'Pending' },
];

export interface CbtExam {
  id: string;
  title: string;
  course: string;
  questions: number;
  duration: string;
  date: string;
  status: string;
}

export const cbtExams: CbtExam[] = [
  { id: 'e1', title: 'CSC 301 Mid-Semester Test', course: 'CSC 301', questions: 40, duration: '45 min', date: '2025-08-04', status: 'Scheduled' },
  { id: 'e2', title: 'GST 111 CBT Quiz', course: 'GST 111', questions: 30, duration: '30 min', date: '2025-07-30', status: 'Live' },
  { id: 'e3', title: 'ACC 202 Continuous Assessment', course: 'ACC 202', questions: 50, duration: '60 min', date: '2025-07-21', status: 'Completed' },
  { id: 'e4', title: 'MCB 304 Practical Theory Test', course: 'MCB 304', questions: 25, duration: '30 min', date: '2025-08-11', status: 'Draft' },
  { id: 'e5', title: 'LAW 201 Mock Bar Quiz', course: 'LAW 201', questions: 60, duration: '90 min', date: '2025-07-14', status: 'Completed' },
];

export interface QuestionBank {
  id: string;
  course: string;
  title: string;
  questions: number;
  owner: string;
  lastUpdated: string;
}

export const questionBanks: QuestionBank[] = [
  { id: 'q1', course: 'CSC 301', title: 'Data Structures — Objective Pool', questions: 220, owner: 'Prof. Adaobi Nnamdi', lastUpdated: '2025-07-18' },
  { id: 'q2', course: 'GST 111', title: 'Communication Skills — General Pool', questions: 340, owner: 'Dr. Femi Olawale', lastUpdated: '2025-07-10' },
  { id: 'q3', course: 'ACC 202', title: 'Financial Accounting — CA Pool', questions: 180, owner: 'Prof. Lekan Fashola', lastUpdated: '2025-06-30' },
  { id: 'q4', course: 'MCB 304', title: 'Microbial Genetics — Theory Pool', questions: 150, owner: 'Dr. Chinedu Okeke', lastUpdated: '2025-07-02' },
  { id: 'q5', course: 'LAW 201', title: 'Law of Contract — Scenario Pool', questions: 120, owner: 'Dr. Hauwa Mohammed', lastUpdated: '2025-06-25' },
];

// ---- Content / CMS ----
export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  author: string;
  updated: string;
  status: string;
}

export const cmsPages: CmsPage[] = [
  { id: 'w1', title: 'Home', slug: '/', author: 'Mr. Tanimu Rabiu', updated: '2025-07-20', status: 'Published' },
  { id: 'w2', title: 'About Us', slug: '/about', author: 'Mr. Tanimu Rabiu', updated: '2025-07-12', status: 'Published' },
  { id: 'w3', title: 'Admissions Guide', slug: '/admissions', author: 'Ms. Amaka Eneh', updated: '2025-07-18', status: 'Published' },
  { id: 'w4', title: 'Academic Calendar', slug: '/calendar', author: 'Mr. Tanimu Rabiu', updated: '2025-07-08', status: 'Published' },
  { id: 'w5', title: 'Scholarships', slug: '/scholarships', author: 'Mrs. Kemi Adeleke', updated: '2025-07-15', status: 'Draft' },
  { id: 'w6', title: 'Contact', slug: '/contact', author: 'Mr. Tanimu Rabiu', updated: '2025-06-28', status: 'Published' },
];

export interface NewsItem {
  id: string;
  title: string;
  author: string;
  category: string;
  date: string;
  status: string;
}

export const news: NewsItem[] = [
  { id: 'n1', title: '2025/2026 Admission Exercise Begins September 1', author: 'Mr. Tanimu Rabiu', category: 'Admissions', date: '2025-07-22', status: 'Published' },
  { id: 'n2', title: 'University Partners with Tech Hub on Innovation Lab', author: 'Prof. Adaobi Nnamdi', category: 'Partnership', date: '2025-07-18', status: 'Published' },
  { id: 'n3', title: 'Convocation Ceremony Holds October 17', author: 'Mr. Tanimu Rabiu', category: 'Events', date: '2025-07-15', status: 'Published' },
  { id: 'n4', title: 'New Engineering Complex Commissioned', author: 'Engr. Bola Ige', category: 'Development', date: '2025-07-10', status: 'Draft' },
  { id: 'n5', title: 'Students Win National Case Competition', author: 'Dr. Femi Olawale', category: 'Achievement', date: '2025-07-05', status: 'Published' },
];

export interface EventItem {
  id: string;
  title: string;
  date: string;
  venue: string;
  attendees: number;
  status: string;
}

export const events: EventItem[] = [
  { id: 'ev1', title: 'Freshers Orientation Week', date: '2025-09-08', venue: 'Main Auditorium', attendees: 2400, status: 'Scheduled' },
  { id: 'ev2', title: 'Career & Internship Fair', date: '2025-08-21', venue: 'Sports Complex', attendees: 1200, status: 'Scheduled' },
  { id: 'ev3', title: 'Matriculation Ceremony', date: '2025-09-19', venue: 'Convocation Arena', attendees: 3100, status: 'Scheduled' },
  { id: 'ev4', title: 'Inter-Departmental Sports Week', date: '2025-07-14', venue: 'University Sports Ground', attendees: 1800, status: 'Completed' },
  { id: 'ev5', title: 'Research & Innovation Summit', date: '2025-06-26', venue: 'Senate Building', attendees: 650, status: 'Completed' },
];

// ---- Digital ID Cards ----
export interface IdCard {
  id: string;
  name: string;
  matricNo: string;
  department: string;
  level: string;
  cardNo: string;
  expiry: string;
}

export const idCards: IdCard[] = [
  { id: 'id1', name: 'Adaeze Okonkwo', matricNo: 'GDU/CSC/2023/0142', department: 'Computer Science', level: '300', cardNo: 'GDU-ID-2025-3F9K1Q', expiry: '09/2026' },
  { id: 'id2', name: 'Tunde Bakare', matricNo: 'GDU/CSC/2024/0311', department: 'Computer Science', level: '200', cardNo: 'GDU-ID-2025-7B2M4X', expiry: '09/2026' },
  { id: 'id3', name: 'Chiamaka Eze', matricNo: 'GDU/ACC/2022/0078', department: 'Accountancy', level: '400', cardNo: 'GDU-ID-2025-9D6T2L', expiry: '09/2026' },
  { id: 'id4', name: 'Ibrahim Musa', matricNo: 'GDU/MCB/2023/0205', department: 'Microbiology', level: '300', cardNo: 'GDU-ID-2025-1W8P5C', expiry: '09/2026' },
  { id: 'id5', name: 'Folake Adeyemi', matricNo: 'GDU/LAW/2024/0119', department: 'Law', level: '200', cardNo: 'GDU-ID-2025-5R3N8V', expiry: '09/2026' },
  { id: 'id6', name: 'Halima Bello', matricNo: 'GDU/NUR/2023/0260', department: 'Nursing Science', level: '300', cardNo: 'GDU-ID-2025-2K7J6A', expiry: '09/2026' },
];

// ---- Reports ----
export interface ReportCategory {
  id: string;
  title: string;
  description: string;
  count: number;
}

export const reportCategories: ReportCategory[] = [
  { id: 'rc1', title: 'Student Records', description: 'Enrollment, biodata and status reports', count: 12 },
  { id: 'rc2', title: 'Academic Results', description: 'Broadsheets, GPA/CGPA and grade summaries', count: 9 },
  { id: 'rc3', title: 'Financial Statements', description: 'Revenue, fees and outstanding balances', count: 15 },
  { id: 'rc4', title: 'Admissions Analytics', description: 'Applications, offers and acceptance trends', count: 6 },
  { id: 'rc5', title: 'Staff & Payroll', description: 'Staffing levels and payroll summaries', count: 4 },
  { id: 'rc6', title: 'CBT & Assessment', description: 'Exam performance and item analysis', count: 7 },
];

export interface ReportRow {
  id: string;
  name: string;
  type: string;
  generatedBy: string;
  date: string;
  format: string;
  status: string;
}

export const reportRows: ReportRow[] = [
  { id: 'rr1', name: '2024/2025 Second Semester Broadsheet', type: 'Academic Results', generatedBy: 'Prof. Adaobi Nnamdi', date: '2025-07-23', format: 'PDF', status: 'Ready' },
  { id: 'rr2', name: 'July 2025 Revenue Summary', type: 'Financial Statements', generatedBy: 'Mrs. Kemi Adeleke', date: '2025-07-24', format: 'XLSX', status: 'Ready' },
  { id: 'rr3', name: 'New Admissions — July Intake', type: 'Admissions Analytics', generatedBy: 'Ms. Amaka Eneh', date: '2025-07-22', format: 'PDF', status: 'Ready' },
  { id: 'rr4', name: 'Outstanding Fees — 400 Level', type: 'Financial Statements', generatedBy: 'Mrs. Kemi Adeleke', date: '2025-07-20', format: 'XLSX', status: 'Processing' },
  { id: 'rr5', name: 'Active Students by Department', type: 'Student Records', generatedBy: 'Mr. Tanimu Rabiu', date: '2025-07-18', format: 'CSV', status: 'Ready' },
];

// ---- Communication ----
export interface Announcement {
  id: string;
  title: string;
  audience: string;
  channel: string;
  date: string;
  status: string;
}

export const announcements: Announcement[] = [
  { id: 'an1', title: 'Second Semester Exams Begin August 4', audience: 'All Students', channel: 'Email + SMS', date: '2025-07-24', status: 'Sent' },
  { id: 'an2', title: 'Staff Meeting — Results Harmonization', audience: 'All Staff', channel: 'Email', date: '2025-07-22', status: 'Sent' },
  { id: 'an3', title: 'Portal Maintenance Window (Sat 2AM–4AM)', audience: 'Everyone', channel: 'In-App', date: '2025-07-21', status: 'Sent' },
  { id: 'an4', title: 'Freshers: Submit O-Level Results Before Resumption', audience: 'New Students', channel: 'Email + SMS', date: '2025-07-25', status: 'Draft' },
];

// ---- Audit ----
export interface AuditLog {
  id: string;
  user: string;
  action: string;
  entity: string;
  ip: string;
  date: string;
  status: string;
}

export const auditLogs: AuditLog[] = [
  { id: 'al1', user: 'admin@gdu.edu.ng', action: 'Approved results', entity: 'CSC 301 — 300 Level', ip: '10.24.8.11', date: '2025-07-24 14:32', status: 'Success' },
  { id: 'al2', user: 'kemi.adeleke@gdu.edu.ng', action: 'Recorded payment', entity: 'GIS-PAY-20250724-8F3K1Q', ip: '10.24.8.42', date: '2025-07-24 11:05', status: 'Success' },
  { id: 'al3', user: 'amaka.eneh@gdu.edu.ng', action: 'Updated application status', entity: 'APP/2025/0004213', ip: '10.24.9.7', date: '2025-07-24 09:48', status: 'Success' },
  { id: 'al4', user: 'unknown', action: 'Failed sign-in attempt', entity: 'admin@gdu.edu.ng', ip: '197.210.44.2', date: '2025-07-24 03:12', status: 'Failed' },
  { id: 'al5', user: 'tanimu.rabiu@gdu.edu.ng', action: 'Published page', entity: 'Admissions Guide', ip: '10.24.8.3', date: '2025-07-23 16:20', status: 'Success' },
  { id: 'al6', user: 'adaobi.nnamdi@gdu.edu.ng', action: 'Uploaded question bank', entity: 'CSC 301 — Objective Pool', ip: '10.24.11.9', date: '2025-07-23 13:41', status: 'Success' },
  { id: 'al7', user: 'admin@gdu.edu.ng', action: 'Changed grading scale', entity: 'University Grading Policy', ip: '10.24.8.11', date: '2025-07-22 10:15', status: 'Success' },
];

// ---- Dashboard ----
export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

export const recentActivity: Activity[] = [
  { id: 'ac1', user: 'Amaka Eneh', action: 'reviewed application', target: 'APP/2025/0004213 — Blessing Okafor', time: '12 min ago' },
  { id: 'ac2', user: 'Kemi Adeleke', action: 'recorded payment', target: 'GIS-PAY-20250724-8F3K1Q — ₦285,000', time: '41 min ago' },
  { id: 'ac3', user: 'Prof. Adaobi Nnamdi', action: 'published results', target: 'CSC 301 — Data Structures', time: '2 hrs ago' },
  { id: 'ac4', user: 'Tanimu Rabiu', action: 'updated page', target: 'Admissions Guide', time: '5 hrs ago' },
  { id: 'ac5', user: 'Dr. Femi Olawale', action: 'scheduled CBT exam', target: 'GST 111 CBT Quiz', time: 'Yesterday' },
  { id: 'ac6', user: 'System', action: 'generated ID cards', target: '6 new student cards', time: 'Yesterday' },
];

// ---- Chart datasets ----
export interface RevenuePoint {
  month: string;
  revenue: number;
  target: number;
}

export const revenueByMonth: RevenuePoint[] = [
  { month: 'Feb', revenue: 92_400_000, target: 95_000_000 },
  { month: 'Mar', revenue: 108_200_000, target: 100_000_000 },
  { month: 'Apr', revenue: 96_800_000, target: 100_000_000 },
  { month: 'May', revenue: 121_500_000, target: 110_000_000 },
  { month: 'Jun', revenue: 133_900_000, target: 115_000_000 },
  { month: 'Jul', revenue: 184_500_000, target: 120_000_000 },
];

export interface AdmissionPoint {
  month: string;
  applications: number;
  admitted: number;
}

export const admissionsByMonth: AdmissionPoint[] = [
  { month: 'Feb', applications: 420, admitted: 180 },
  { month: 'Mar', applications: 512, admitted: 224 },
  { month: 'Apr', applications: 468, admitted: 201 },
  { month: 'May', applications: 590, admitted: 262 },
  { month: 'Jun', applications: 674, admitted: 290 },
  { month: 'Jul', applications: 731, admitted: 312 },
];

export interface NameValue {
  name: string;
  value: number;
}

export const genderDistribution: NameValue[] = [
  { name: 'Female', value: 2560 },
  { name: 'Male', value: 2261 },
];

export const enrollmentByDepartment: NameValue[] = [
  { name: 'CSC', value: 812 },
  { name: 'ACC', value: 655 },
  { name: 'ECO', value: 587 },
  { name: 'EEE', value: 502 },
  { name: 'MCB', value: 431 },
  { name: 'BCH', value: 402 },
  { name: 'LAW', value: 388 },
  { name: 'NUR', value: 340 },
];

export const paymentMethods: NameValue[] = [
  { name: 'Card', value: 46 },
  { name: 'Bank Transfer', value: 34 },
  { name: 'USSD', value: 20 },
];
