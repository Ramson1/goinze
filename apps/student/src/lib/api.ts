/**
 * Auth-aware API client for the student portal.
 * Reads the access token from the `gz_access_token` cookie set at login.
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
  const match = document.cookie.match(/(?:^|; )gz_access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearTokens() {
  if (typeof document === 'undefined') return;
  document.cookie = 'gz_access_token=; path=/; max-age=0';
  document.cookie = 'gz_refresh_token=; path=/; max-age=0';
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
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data ?? {}) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};

// ---- Types mirroring the API responses ----

export interface StudentProfile {
  id: string;
  userId: string | null;
  matricNo: string | null;
  regNumber: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string | null;
  dateOfBirth: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  stateOfOrigin: string | null;
  nationality: string | null;
  passportUrl: string | null;
  status: string;
  currentLevel: number | null;
  faculty: string | null;
  department: string | null;
  programme: string | null;
  session: string | null;
  guardian: {
    name: string | null;
    relationship: string | null;
    phone: string | null;
    email: string | null;
  };
  medical: {
    bloodGroup: string | null;
    genotype: string | null;
    notes: string | null;
  };
}

export interface DigitalId {
  cardNumber: string;
  verificationCode: string;
  qrData: string | null;
  photoUrl: string | null;
  issuedAt: string;
  expiresAt: string | null;
  status: string;
  student: {
    firstName: string;
    lastName: string;
    matricNo: string | null;
    programme: string | null;
    department: string | null;
    level: number | null;
  };
}

export interface FeeItem {
  id: string;
  description: string;
  type: string;
  amount: number;
  status: 'PAID' | 'PENDING';
  ref: string | null;
  paidAt: string | null;
  isOptional?: boolean;
  locked?: boolean;
  sessionName?: string;
  semester?: string | null;
  sessionId?: string | null;
}

export interface ReceiptItem {
  id: string;
  receiptNo: string;
  description: string;
  amount: number;
  date: string;
  method: string;
  verificationCode: string | null;
  status: 'SUCCESS';
  reference: string;
}

export interface FeesResponse {
  items: FeeItem[];
  receipts: ReceiptItem[];
  summary: { total: number; paid: number; outstanding: number };
}

export interface ResultCourse {
  resultId: string;
  code: string;
  title: string;
  units: number;
  session: string;
  score: number;
  grade: string | null;
}

export interface SemesterResult {
  id: string;
  session: string;
  semester: string;
  level: number;
  courses: ResultCourse[];
  gpa: number;
}

export interface ResultsResponse {
  semesters: SemesterResult[];
  cgpa: number;
  classification: string;
  totalUnits: number;
  passed: number;
  failed: number;
}

export interface RegisteredCourse {
  code: string;
  title: string;
  units: number;
  semester: string;
  status: string;
}

export interface RegisteredCoursesResponse {
  registration: {
    id: string;
    session: string;
    semester: string;
    level: number;
    status: string;
  } | null;
  courses: RegisteredCourse[];
  totalUnits: number;
}

export interface DashboardResponse {
  profile: StudentProfile;
  cgpa: number;
  classification: string;
  outstandingFees: number;
  registeredUnits: number;
  registeredCount: number;
  upcomingExams: {
    id: string;
    title: string;
    courseCode: string | null;
    courseTitle: string | null;
    department: string | null;
    startsAt: string | null;
    durationMins: number;
    status: string;
  }[];
  announcements: { id: string; title: string; body: string; date: string }[];
}

export interface AvailableCourse {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  semester: string;
}

export interface AvailableCoursesResponse {
  semester: string;
  session: string | null;
  sessionId: string | null;
  level: number;
  minUnits: number;
  maxUnits: number;
  locked: boolean;
  courses: AvailableCourse[];
  existing: {
    id: string;
    status: string;
    totalUnits: number;
    courseIds: string[];
  } | null;
}

export interface SubmitRegistrationResponse {
  id: string;
  status: string;
  semester: string;
  session: string;
  level: number;
  totalUnits: number;
  courses: { code: string; title: string; units: number }[];
}

export const studentApi = {
  profile: () => api.get<StudentProfile>('/students/me'),
  digitalId: () => api.get<DigitalId>('/students/me/digital-id'),
  fees: () => api.get<FeesResponse>('/students/me/fees'),
  results: () => api.get<ResultsResponse>('/students/me/results'),
  registeredCourses: () => api.get<RegisteredCoursesResponse>('/students/me/courses'),
  dashboard: () => api.get<DashboardResponse>('/students/me/dashboard'),
  availableCourses: (semester: string = 'FIRST') =>
    api.get<AvailableCoursesResponse>(
      `/students/me/available-courses?semester=${encodeURIComponent(semester)}`,
    ),
  submitRegistration: (payload: { courseIds: string[]; semester?: string }) =>
    api.post<SubmitRegistrationResponse>('/students/me/course-registration', payload),
};

// ---- Finance (student-scoped) ----

export interface InitPaymentResult {
  payment: { id: string; reference: string; amount: string; status: string };
  reference: string;
  checkoutUrl: string;
  live: boolean;
}

export interface ReceiptData {
  id: string;
  receiptNumber: string;
  verificationCode: string;
  createdAt: string;
}

export interface VerifyPaymentResult {
  id: string;
  status: string;
  reference: string;
  gatewayRef: string | null;
  amount: string;
  paidAt: string | null;
  receipt?: ReceiptData;
  school?: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
  };
  student?: {
    firstName: string;
    lastName: string;
    middleName: string | null;
    email: string | null;
    matricNumber: string | null;
    department?: { name: string } | null;
    programme?: { name: string } | null;
  };
  feeStructure?: {
    name: string;
    type: string;
  } | null;
}

export interface FlutterwaveConfig {
  publicKey: string;
  isConfigured: boolean;
}

export const financeApi = {
  /** Fetch Flutterwave public key and config from the API. */
  getFlutterwaveConfig: () => api.get<FlutterwaveConfig>('/finance/flutterwave-config'),
  /** Fetch Portal Access Flutterwave public key from the API. */
  getPortalAccessPublicKey: () => api.get<{ publicKey: string }>('/finance/portal-access-public-key'),
  initPayment: (data: {
    feeStructureId?: string;
    studentId?: string;
    amount: number;
    customerEmail?: string;
    redirectUrl?: string;
    purpose?: string;
  }) => api.post<InitPaymentResult>('/finance/payments/init', data),
  verifyPayment: (reference: string) =>
    api.post<VerifyPaymentResult>('/finance/payments/verify', { reference }),
};

// ---- Communication ----

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  channel: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
  createdAt: string;
}

export interface MessageRecord {
  id: string;
  senderId: string;
  recipientId: string | null;
  subject: string | null;
  body: string;
  readAt: string | null;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string } | null;
}

// ---- Conversations ----

export interface ConversationSummary {
  id: string;
  title: string | null;
  otherAvatarUrl: string | null;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
  participants: { id: string; userId: string; user: { id: string; firstName: string; lastName: string; role?: string; avatarUrl?: string | null } }[];
}

export interface ConversationDetail {
  id: string;
  title: string | null;
  isGroup: boolean;
  createdAt: string;
  participants: { id: string; userId: string; user: { id: string; firstName: string; lastName: string; role?: string } }[];
  messages: ConversationMessage[];
}

export interface ConversationMessage {
  id: string;
  senderId: string;
  body: string;
  conversationId: string;
  replyToId: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  readAt: string | null;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string; avatarUrl?: string | null } | null;
  replyTo: { id: string; body: string; sender: { id: string; firstName: string; lastName: string } | null } | null;
}

export interface ContactItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

export const commApi = {
  notifications: () => api.get<NotificationRecord[]>('/communication/notifications'),
  markNotificationRead: (id: string) =>
    api.patch<NotificationRecord>(`/communication/notifications/${id}/read`),
  messages: () => api.get<MessageRecord[]>('/communication/messages'),
  sendMessage: (payload: { recipientId?: string; subject?: string; body: string }) =>
    api.post<MessageRecord>('/communication/messages', payload),
  markMessageRead: (id: string) =>
    api.patch<MessageRecord>(`/communication/messages/${id}/read`),
};

export const conversationApi = {
  list: () => api.get<ConversationSummary[]>('/communication/conversations'),
  get: (id: string) => api.get<ConversationDetail>(`/communication/conversations/${id}`),
  create: (data: { recipientIds: string[]; title?: string; isGroup?: boolean }) =>
    api.post<ConversationDetail>('/communication/conversations', data),
  messages: (id: string) => api.get<ConversationMessage[]>(`/communication/conversations/${id}/messages`),
  sendMessage: (id: string, data: { body: string; replyToId?: string }) =>
    api.post<ConversationMessage>(`/communication/conversations/${id}/messages`, data),
  editMessage: (id: string, body: string) =>
    api.patch<ConversationMessage>(`/communication/messages/${id}`, { body }),
  deleteMessage: (id: string) =>
    api.delete(`/communication/messages/${id}`),
  markRead: (id: string) =>
    api.patch(`/communication/conversations/${id}/read`),
  contacts: (q?: string, role?: string) => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (role) params.set('role', role);
        return api.get<ContactItem[]>(`/communication/contacts?${params.toString()}`);
      },
};

// ---- Website content (public CMS) ----

export interface NewsRecord {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface EventRecord {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  coverUrl: string | null;
  createdAt: string;
}

export interface WebsiteContentRecord {
  id: string;
  key: string;
  title: string | null;
  body: unknown;
  updatedAt: string;
}

export const contentApi = {
  news: () => api.get<NewsRecord[]>('/website/news'),
  events: () => api.get<EventRecord[]>('/website/events'),
  content: () => api.get<WebsiteContentRecord[]>('/website/content'),
};

// ---- CBT (student-facing) ----

export interface CbtOption {
  id: string;
  text: string;
  order: number | null;
}

export interface CbtQuestion {
  id: string;
  type: 'OBJECTIVE' | 'MULTI_SELECT' | 'TRUE_FALSE' | 'ESSAY' | 'FILL_BLANK';
  text: string;
  marks: number;
  options: CbtOption[];
}

export interface CbtExamRecord {
  id: string;
  title: string;
  instructions: string | null;
  durationMins: number;
  passMark: number;
  shuffleQuestions: boolean;
  lockBrowser: boolean;
  startsAt: string | null;
  endsAt: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  createdAt: string;
  course: { id: string; code: string; title: string } | null;
  _count: { questions: number; attempts: number };
}

export interface CbtExamDetail extends Omit<CbtExamRecord, '_count'> {
  questions: { id: string; order: number | null; question: CbtQuestion }[];
}

export interface CbtAttemptRecord {
  id: string;
  examId: string;
  studentId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'ABANDONED';
  score: number | string | null;
  startedAt: string;
  submittedAt: string | null;
}

export interface CbtAnswerInput {
  questionId: string;
  selectedOptions?: string[];
  essayText?: string;
}

export interface CbtSubmitResponse extends CbtAttemptRecord {
  responses: {
    questionId: string;
    isCorrect: boolean;
    awardedMarks: number;
  }[];
}

export const cbtStudentApi = {
  exams: () => api.get<CbtExamRecord[]>('/cbt/exams'),
  exam: (id: string) => api.get<CbtExamDetail>(`/cbt/exams/${id}`),
  startAttempt: (payload: { examId: string; studentId: string; code?: string }) =>
    api.post<CbtAttemptRecord>('/cbt/attempts/start', payload),
  submitAttempt: (attemptId: string, answers: CbtAnswerInput[]) =>
    api.post<CbtSubmitResponse>(`/cbt/attempts/${attemptId}/submit`, { answers }),
};

// ---- Documents ----

export interface DocumentRecord {
  id: string;
  name: string;
  url: string;
  type: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export const documentsApi = {
  mine: (studentId: string) =>
    api.get<{ documents: DocumentRecord[]; admissionLetterUrl: string | null }>(
      `/documents/student/${studentId}`,
    ),
};

// ---- Result PINs ----

export const resultsApi = {
  verifyPin: (payload: { code: string }) =>
    api.post<{ valid: boolean; usesLeft: number }>('/results/pins/verify', payload),
};

// ---- Auth ----

export const authApi = {
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.patch<{ success: boolean }>('/auth/change-password', payload),
};
