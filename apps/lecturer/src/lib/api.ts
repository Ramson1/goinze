/**
 * Auth-aware API client for the lecturer portal.
 * Reads the access token from the `goinze_token` cookie set at login.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )goinze_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearTokens() {
  if (typeof document === 'undefined') return;
  document.cookie = 'goinze_token=; path=/; max-age=0';
  document.cookie = 'goinze_refresh_token=; path=/; max-age=0';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const message = (body && (body.message || body.error)) || `Request failed (${res.status})`;
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, res.status);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) }),
};

// ---- Types mirroring the API responses ----

export interface LecturerProfile {
  id: string;
  staffNumber: string | null;
  firstName: string;
  lastName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  designation: string | null;
  qualification: string | null;
  department: string | null;
  faculty: string | null;
  session: string | null;
}

export interface AllocatedCourse {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  level: number;
  semester: string;
  department: string | null;
  studentCount: number;
}

export interface PendingRegistration {
  id: string;
  studentName: string;
  matricNo: string | null;
  level: number;
  department: string | null;
  session: string;
  semester: string;
  totalUnits: number;
  courseCount: number;
  status: string;
  createdAt: string;
}

export interface DashboardResponse {
  profile: LecturerProfile;
  courses: AllocatedCourse[];
  pendingRegistrations: PendingRegistration[];
  stats: {
    coursesAllocated: number;
    totalStudents: number;
    pendingRegistrations: number;
    publishedResults: number;
  };
  session: string | null;
}

export interface RosterStudent {
  studentId: string;
  matricNo: string | null;
  firstName: string;
  lastName: string;
  level: number | null;
  regStatus: string;
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  resultStatus: string | null;
}

export interface CourseRosterResponse {
  course: {
    id: string;
    code: string;
    title: string;
    level: number;
    semester: string;
  };
  session: string;
  sessionId: string;
  students: RosterStudent[];
}

export interface ResultRow {
  studentId: string;
  matricNo: string | null;
  name: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string | null;
  status: string;
}

export interface CourseResultsResponse {
  course: {
    id: string;
    code: string;
    title: string;
    level: number;
    semester: string;
  };
  session: string;
  rows: ResultRow[];
  summary: {
    total: number;
    draft: number;
    submitted: number;
    published: number;
  };
}

export interface ScoreRowPayload {
  studentId: string;
  caScore: number;
  examScore: number;
}

export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface ExamRecord {
  id: string;
  title: string;
  instructions: string | null;
  durationMins: number;
  totalMarks: number;
  passMark: number;
  shuffleQuestions: boolean;
  lockBrowser: boolean;
  startsAt: string | null;
  endsAt: string | null;
  status: ExamStatus;
  createdAt: string;
  course: { id: string; code: string; title: string } | null;
  _count: { questions: number; attempts: number };
}

export interface ExamInput {
  title: string;
  courseId?: string;
  instructions?: string;
  durationMins?: number;
  passMark?: number;
  shuffleQuestions?: boolean;
  lockBrowser?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface ExamAttemptRecord {
  id: string;
  examId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'ABANDONED';
  score: string; // Prisma Decimal serializes as string
  startedAt: string;
  submittedAt: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    matricNumber: string | null;
  };
}

// ---- Messages ----

export interface InboxMessage {
  id: string;
  senderId: string;
  recipientId: string | null;
  subject: string | null;
  body: string;
  readAt: string | null;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string } | null;
}

export interface Contact {
  id: string;
  name: string;
  matricNo: string | null;
  courseCode: string;
}

// ---- Notifications ----

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  channel: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
  createdAt: string;
}

// ---- School events (website CMS, used by the calendar) ----

export interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
}

// ---- Attendance ----

export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string | null;
  date: string;
  status: string;
  method: string;
  student: { id: string; firstName: string; lastName: string; matricNumber: string | null } | null;
}

// ---- CBT ----

export interface QuestionBank {
  id: string;
  title: string;
  courseId: string | null;
  category: string | null;
  _count: { questions: number };
}

export interface CbtOption {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface CbtQuestion {
  id: string;
  bankId: string;
  type: string;
  text: string;
  marks: number;
  difficulty: string | null;
  explanation: string | null;
  options: CbtOption[];
}

export interface QuestionInput {
  bankId: string;
  type?: string;
  text: string;
  marks?: number;
  difficulty?: string;
  options?: { text: string; isCorrect?: boolean }[];
}

export const lecturerApi = {
  profile: () => api.get<LecturerProfile>('/lecturers/me'),
  dashboard: () => api.get<DashboardResponse>('/lecturers/me/dashboard'),
  courses: () => api.get<AllocatedCourse[]>('/lecturers/me/courses'),
  roster: (courseId: string) =>
    api.get<CourseRosterResponse>(`/lecturers/me/courses/${courseId}/roster`),
  courseResults: (courseId: string) =>
    api.get<CourseResultsResponse>(`/lecturers/me/courses/${courseId}/results`),
  saveScores: (courseId: string, rows: ScoreRowPayload[]) =>
    api.post<{ processed: number }>(`/lecturers/me/courses/${courseId}/scores`, { rows }),
  submitResults: (courseId: string) =>
    api.patch<{ updated: number }>(`/lecturers/me/courses/${courseId}/submit`),
  publishResults: (courseId: string) =>
    api.patch<{ published: number }>(`/lecturers/me/courses/${courseId}/publish`),
  pendingRegistrations: () => api.get<PendingRegistration[]>('/lecturers/me/registrations'),
  approveRegistration: (id: string) =>
    api.patch(`/lecturers/me/registrations/${id}/approve`),

  // Attendance
  attendance: (courseId: string, date: string) => {
    const q = new URLSearchParams({ courseId, date });
    return api.get<AttendanceRecord[]>(`/attendance?${q.toString()}`);
  },
  markAttendance: (
    courseId: string,
    date: string,
    records: { studentId: string; status: string }[],
  ) => api.post<{ marked: number }>('/attendance/mark', { courseId, date, records }),
  courseAttendance: (courseId: string) =>
    api.get<AttendanceRecord[]>(`/attendance?${new URLSearchParams({ courseId }).toString()}`),

  // CBT
  questionBanks: () => api.get<QuestionBank[]>('/cbt/question-banks'),
  createBank: (payload: { title: string; courseId?: string; category?: string }) =>
    api.post<QuestionBank>('/cbt/question-banks', payload),
  bankQuestions: (bankId: string) =>
    api.get<CbtQuestion[]>(`/cbt/question-banks/${bankId}/questions`),
  createQuestion: (payload: QuestionInput) => api.post<CbtQuestion>('/cbt/questions', payload),
  exams: () => api.get<ExamRecord[]>('/cbt/exams'),
  createExam: (payload: ExamInput) => api.post<ExamRecord>('/cbt/exams', payload),
  setExamStatus: (id: string, status: ExamStatus) =>
    api.patch<ExamRecord>(`/cbt/exams/${id}/status`, { status }),
  addExamQuestions: (examId: string, questionIds: string[]) =>
    api.post<{ count: number }>(`/cbt/exams/${examId}/questions`, { questionIds }),
  examAttempts: (examId: string) =>
    api.get<ExamAttemptRecord[]>(`/cbt/exams/${examId}/attempts`),

  // Messages
  messages: () => api.get<InboxMessage[]>('/communication/messages'),
  sendMessage: (payload: { recipientId?: string; subject?: string; body: string }) =>
    api.post<InboxMessage>('/communication/messages', payload),
  markMessageRead: (id: string) =>
    api.patch<InboxMessage>(`/communication/messages/${id}/read`),
  contacts: () => api.get<Contact[]>('/lecturers/me/contacts'),

  // Notifications
  notifications: () => api.get<NotificationRecord[]>('/communication/notifications'),
  markNotificationRead: (id: string) =>
    api.patch<NotificationRecord>(`/communication/notifications/${id}/read`),

  // Profile
  updateProfile: (payload: { phone?: string; designation?: string; qualification?: string }) =>
    api.patch<LecturerProfile>('/lecturers/me', payload),

  // School events (public CMS endpoint, used by the calendar)
  schoolEvents: () => api.get<SchoolEvent[]>('/website/events'),
};
