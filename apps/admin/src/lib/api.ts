/**
 * Auth-aware API client for the admin portal.
 * Reads the access token from the `access_token` cookie set at login.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
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
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data ?? {}) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) }),
};

// ---- Admissions ----

export interface ApplicationRecord {
  id: string;
  applicationNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  acceptanceFeePaid: boolean;
  admissionLetterUrl: string | null;
  createdAt: string;
  programmeId: string | null;
  departmentId: string | null;
  student: { id: string; matricNumber: string | null; status: string } | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const admissionsApi = {
  list: (params?: { page?: number; pageSize?: number; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return api.get<Paginated<ApplicationRecord>>(`/admissions${qs ? `?${qs}` : ''}`);
  },
  approve: (id: string) => api.patch<ApplicationRecord>(`/admissions/${id}/approve`),
  reject: (id: string) =>
    api.patch<ApplicationRecord>(`/admissions/${id}/review`, { status: 'REJECTED' }),
  admit: (id: string) => api.patch<ApplicationRecord>(`/admissions/${id}/admit`),
  generateLetter: (id: string) =>
    api.post<ApplicationRecord>(`/admissions/${id}/letter`),
};

// ---- Finance ----

export interface InitPaymentResult {
  payment: { id: string; reference: string; amount: string; status: string };
  reference: string;
  checkoutUrl: string;
  live: boolean;
}

export interface FinanceDashboard {
  totalCollected: number;
  pendingCount: number;
  pendingAmount: number;
  totalCount: number;
  refundedCount: number;
  refundedAmount: number;
}

export interface FeeStructure {
  id: string;
  name: string;
  type: string;
  amount: string; // Prisma Decimal -> string
  level: number | null;
  programmeId: string | null;
  isMandatory: boolean;
  allowInstallment: boolean;
  sessionId: string | null;
  session: { id: string; name: string } | null;
}

export interface Payment {
  id: string;
  reference: string;
  gatewayRef: string | null;
  amount: string; // Prisma Decimal -> string
  currency: string;
  gateway: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  studentId: string | null;
  applicationId: string | null;
  feeStructureId: string | null;
  student: { id: string; firstName: string; lastName: string; matricNumber: string | null } | null;
  feeStructure: { id: string; name: string; type: string } | null;
  receipt: { id: string; receiptNumber: string } | null;
}

export const financeApi = {
  // Acceptance-fee flow (used by the admissions page)
  initAcceptanceFee: (applicationId: string, amount: number, redirectUrl?: string) =>
    api.post<InitPaymentResult>('/finance/payments/init', {
      applicationId,
      amount,
      redirectUrl,
    }),
  verify: (reference: string) =>
    api.post<{ id: string; status: string }>('/finance/payments/verify', { reference }),

  // Admin finance
  dashboard: () => api.get<FinanceDashboard>('/finance/dashboard'),
  payments: (params?: { page?: number; pageSize?: number; search?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return api.get<Paginated<Payment>>(`/finance/payments${qs ? `?${qs}` : ''}`);
  },
  feeStructures: () => api.get<FeeStructure[]>('/finance/fee-structures'),
  createFeeStructure: (payload: {
    name: string;
    amount: number;
    type?: string;
    level?: number;
    isMandatory?: boolean;
    allowInstallment?: boolean;
  }) => api.post<FeeStructure>('/finance/fee-structures', payload),
  refund: (paymentId: string, reason?: string) =>
    api.post<{ id: string; amount: string }>('/finance/refunds', { paymentId, reason }),
};

// ---- Results (admin approval workflow) ----

export interface CourseResultSummary {
  courseId: string;
  code: string;
  title: string;
  level: number;
  semester: string;
  department: string | null;
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  locked: number;
  published: number;
}

export interface CourseSummariesResponse {
  session: string | null;
  courses: CourseResultSummary[];
}

export interface AdminResultRow {
  id: string;
  studentId: string;
  studentName: string;
  matricNo: string | null;
  semester: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string | null;
  gradePoint: number;
  status: string;
  publishedAt: string | null;
}

export interface CourseResultsResponse {
  session: string | null;
  course: { id: string; code: string; title: string; level: number } | null;
  rows: AdminResultRow[];
}

export const resultsApi = {
  courseSummaries: () => api.get<CourseSummariesResponse>('/results/admin/courses'),
  courseResults: (courseId: string) =>
    api.get<CourseResultsResponse>(`/results/admin/courses/${courseId}`),
  approveCourse: (courseId: string) =>
    api.patch<{ updated: number }>(`/results/admin/courses/${courseId}/approve`),
  lockCourse: (courseId: string) =>
    api.patch<{ updated: number }>(`/results/admin/courses/${courseId}/lock`),
  publishCourse: (courseId: string) =>
    api.patch<{ updated: number }>(`/results/admin/courses/${courseId}/publish`),
};

// ---- Students ----

export type StudentStatus =
  | 'APPLICANT'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'GRADUATED'
  | 'WITHDRAWN'
  | 'ARCHIVED';

export interface DepartmentRef {
  id: string;
  name: string;
  code: string;
}

export interface Student {
  id: string;
  matricNumber: string | null;
  regNumber: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  status: StudentStatus;
  currentLevel: number | null;
  programmeId: string | null;
  departmentId: string | null;
  programme: { id: string; name: string } | null;
  department: { id: string; name: string; code: string } | null;
  createdAt: string;
}

export interface StudentInput {
  firstName: string;
  lastName: string;
  middleName?: string;
  gender?: string;
  email?: string;
  phone?: string;
  matricNumber?: string;
  regNumber?: string;
  programmeId?: string;
  departmentId?: string;
  currentLevel?: number;
  status?: StudentStatus;
}

export const studentsApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    departmentId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.departmentId) q.set('departmentId', params.departmentId);
    const qs = q.toString();
    return api.get<Paginated<Student>>(`/students${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => api.get<Student>(`/students/${id}`),
  create: (payload: StudentInput) => api.post<Student>('/students', payload),
  update: (id: string, payload: Partial<StudentInput>) =>
    api.patch<Student>(`/students/${id}`, payload),
  suspend: (id: string) => api.patch<Student>(`/students/${id}/suspend`),
  graduate: (id: string) => api.patch<Student>(`/students/${id}/graduate`),
  archive: (id: string) => api.patch<Student>(`/students/${id}/archive`),
  departments: () => api.get<DepartmentRef[]>('/academics/departments'),
};

// ---- Analytics (admin dashboard) ----

export interface DashboardSummary {
  counts: {
    students: number;
    staff: number;
    applications: number;
    activeExams: number;
    pendingPayments: number;
  };
  revenue: number;
}

export interface RevenuePoint {
  month: string;
  revenue: number;
}

export interface AdmissionsPoint {
  month: string;
  applications: number;
  admitted: number;
}

export interface NameValue {
  name: string;
  value: number;
}

export const analyticsApi = {
  dashboard: () => api.get<DashboardSummary>('/analytics/dashboard'),
  revenueByMonth: () => api.get<RevenuePoint[]>('/analytics/revenue-by-month'),
  admissionsByMonth: () => api.get<AdmissionsPoint[]>('/analytics/admissions-by-month'),
  enrollmentByDepartment: () => api.get<NameValue[]>('/analytics/enrollment-by-department'),
  genderDistribution: () => api.get<NameValue[]>('/analytics/gender-distribution'),
  paymentMethods: () => api.get<NameValue[]>('/analytics/payment-methods'),
};

// ---- Staff ----

export interface StaffRecord {
  id: string;
  staffNumber: string | null;
  firstName: string;
  lastName: string;
  title: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  designation: string | null;
  salaryGrade: string | null;
  employmentType: string | null;
  employmentDate: string | null;
  qualification: string | null;
  isLecturer: boolean;
  departmentId: string | null;
  department: { id: string; name: string; code: string } | null;
  createdAt: string;
}

export interface StaffInput {
  firstName: string;
  lastName: string;
  title?: string;
  gender?: string;
  email?: string;
  phone?: string;
  staffNumber?: string;
  departmentId?: string;
  designation?: string;
  employmentType?: string;
  qualification?: string;
  isLecturer?: boolean;
}

export const staffApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    departmentId?: string;
    isLecturer?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.search) q.set('search', params.search);
    if (params?.departmentId) q.set('departmentId', params.departmentId);
    if (params?.isLecturer) q.set('isLecturer', params.isLecturer);
    const qs = q.toString();
    return api.get<Paginated<StaffRecord>>(`/staff${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => api.get<StaffRecord>(`/staff/${id}`),
  create: (payload: StaffInput) => api.post<StaffRecord>('/staff', payload),
  update: (id: string, payload: Partial<StaffInput>) =>
    api.patch<StaffRecord>(`/staff/${id}`, payload),
  remove: (id: string) => request<{ deleted: boolean }>(`/staff/${id}`, { method: 'DELETE' }),
};

// ---- Academics (faculties / departments / programmes / courses) ----

export interface Faculty {
  id: string;
  name: string;
  code: string;
}

export interface Programme {
  id: string;
  name: string;
  code: string;
  degreeType: string | null;
  durationYears: number;
}

export interface DepartmentFull {
  id: string;
  name: string;
  code: string;
  description: string | null;
  facultyId: string | null;
  faculty: { id: string; name: string; code: string } | null;
  programmes: Programme[];
}

export interface CourseAllocation {
  id: string;
  staffId: string;
  sessionId: string | null;
  staff: { id: string; firstName: string; lastName: string; title: string | null } | null;
}

export interface CourseRecord {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  level: number;
  semester: string;
  description: string | null;
  departmentId: string | null;
  department: { id: string; name: string; code: string } | null;
  allocations: CourseAllocation[];
}

export const academicsApi = {
  faculties: () => api.get<Faculty[]>('/academics/faculties'),
  departments: () => api.get<DepartmentFull[]>('/academics/departments'),
  createDepartment: (payload: {
    name: string;
    code: string;
    facultyId?: string;
    description?: string;
  }) => api.post<DepartmentFull>('/academics/departments', payload),
  programmes: () => api.get<Programme[]>('/academics/programmes'),
  courses: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    departmentId?: string;
    level?: number;
    semester?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.search) q.set('search', params.search);
    if (params?.departmentId) q.set('departmentId', params.departmentId);
    if (params?.level) q.set('level', String(params.level));
    if (params?.semester) q.set('semester', params.semester);
    const qs = q.toString();
    return api.get<Paginated<CourseRecord>>(`/academics/courses${qs ? `?${qs}` : ''}`);
  },
  createCourse: (payload: {
    code: string;
    title: string;
    departmentId?: string;
    creditUnits?: number;
    level?: number;
    semester?: string;
  }) => api.post<CourseRecord>('/academics/courses', payload),
  allocations: (courseId: string) =>
    api.get<CourseAllocation[]>(`/academics/courses/${courseId}/allocations`),
};

// ---- Academic sessions ----

export interface AcademicSessionRecord {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  createdAt: string;
}

export const sessionsApi = {
  list: () => api.get<AcademicSessionRecord[]>('/academics/sessions'),
  create: (payload: {
    name: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
  }) => api.post<AcademicSessionRecord>('/academics/sessions', payload),
  activate: (id: string) =>
    api.patch<AcademicSessionRecord>(`/academics/sessions/${id}/activate`),
};

// ---- Communication ----

export interface AnnouncementRecord {
  id: string;
  title: string;
  body: string;
  audience: string | null;
  pinned: boolean;
  publishedAt: string;
  createdAt: string;
}

export const communicationApi = {
  announcements: () => api.get<AnnouncementRecord[]>('/communication/announcements'),
  createAnnouncement: (payload: {
    title: string;
    body: string;
    audience?: string;
    pinned?: boolean;
  }) => api.post<AnnouncementRecord>('/communication/announcements', payload),
};

// ---- News ----

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

export const newsApi = {
  list: () => api.get<NewsRecord[]>('/website/news/manage'),
  create: (payload: {
    title: string;
    body: string;
    category?: string;
    excerpt?: string;
    coverUrl?: string;
    published?: boolean;
  }) => api.post<NewsRecord>('/website/news', payload),
  setPublished: (id: string, published: boolean) =>
    api.patch<NewsRecord>(`/website/news/${id}/publish`, { published }),
};

// ---- Events ----

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

export const eventsApi = {
  list: () => api.get<EventRecord[]>('/website/events'),
  create: (payload: {
    title: string;
    description?: string;
    location?: string;
    startsAt: string;
    endsAt?: string;
  }) => api.post<EventRecord>('/website/events', payload),
};

// ---- Reports ----

export interface StudentsReport {
  total: number;
  byStatus: { status: string; count: number }[];
  byGender: { gender: string | null; count: number }[];
}

export interface AdmissionsReport {
  total: number;
  byStatus: { status: string; count: number }[];
}

export interface PaymentsReport {
  totalCollected: number;
  byStatus: { status: string; count: number; amount: number }[];
}

export interface ResultsReport {
  total: number;
  byGrade: { grade: string | null; count: number }[];
}

export interface AttendanceReport {
  byStatus: { status: string; count: number }[];
}

export const reportsApi = {
  students: () => api.get<StudentsReport>('/reports/students'),
  admissions: () => api.get<AdmissionsReport>('/reports/admissions'),
  payments: () => api.get<PaymentsReport>('/reports/payments'),
  results: () => api.get<ResultsReport>('/reports/results'),
  attendance: () => api.get<AttendanceReport>('/reports/attendance'),
};

// ---- CBT ----

export type CbtExamStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface CbtBankRecord {
  id: string;
  title: string;
  courseId: string | null;
  category: string | null;
  createdAt: string;
  _count: { questions: number };
}

export interface CbtOptionRecord {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface CbtQuestionRecord {
  id: string;
  bankId: string;
  type: string;
  text: string;
  marks: number;
  difficulty: string | null;
  explanation: string | null;
  options: CbtOptionRecord[];
}

export interface CbtQuestionInput {
  bankId: string;
  type?: string;
  text: string;
  marks?: number;
  difficulty?: string;
  explanation?: string;
  options?: { text: string; isCorrect?: boolean }[];
}

export interface CbtExamRecord {
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
  status: CbtExamStatus;
  createdAt: string;
  course: { id: string; code: string; title: string } | null;
  _count: { questions: number; attempts: number };
}

export interface CbtExamInput {
  title: string;
  courseId?: string;
  sessionId?: string;
  instructions?: string;
  durationMins?: number;
  passMark?: number;
  shuffleQuestions?: boolean;
  lockBrowser?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface CbtAttemptRecord {
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

export const cbtApi = {
  banks: () => api.get<CbtBankRecord[]>('/cbt/question-banks'),
  createBank: (payload: { title: string; courseId?: string; category?: string }) =>
    api.post<CbtBankRecord>('/cbt/question-banks', payload),
  bankQuestions: (bankId: string) =>
    api.get<CbtQuestionRecord[]>(`/cbt/question-banks/${bankId}/questions`),
  createQuestion: (payload: CbtQuestionInput) =>
    api.post<CbtQuestionRecord>('/cbt/questions', payload),
  exams: () => api.get<CbtExamRecord[]>('/cbt/exams'),
  createExam: (payload: CbtExamInput) => api.post<CbtExamRecord>('/cbt/exams', payload),
  setExamStatus: (id: string, status: CbtExamStatus) =>
    api.patch<CbtExamRecord>(`/cbt/exams/${id}/status`, { status }),
  addExamQuestions: (examId: string, questionIds: string[]) =>
    api.post<{ count: number }>(`/cbt/exams/${examId}/questions`, { questionIds }),
  examAttempts: (examId: string) =>
    api.get<CbtAttemptRecord[]>(`/cbt/exams/${examId}/attempts`),
};

// ---- Website CMS ----

export interface WebsiteContentRecord {
  id: string;
  key: string;
  title: string | null;
  body: unknown;
  updatedAt: string;
}

export interface GalleryItemRecord {
  id: string;
  url: string;
  type: string;
  caption: string | null;
  album: string | null;
  createdAt: string;
}

export const cmsApi = {
  content: () => api.get<WebsiteContentRecord[]>('/website/content'),
  upsertContent: (payload: { key: string; title?: string; body?: unknown }) =>
    api.post<WebsiteContentRecord>('/website/content', payload),
  gallery: () => api.get<GalleryItemRecord[]>('/website/gallery'),
  addGalleryItem: (payload: { url: string; type?: string; caption?: string; album?: string }) =>
    api.post<GalleryItemRecord>('/website/gallery', payload),
  /** Upload a file to Cloudinary and return the hosted URL. */
  uploadMedia: async (file: File): Promise<{ url: string; publicId: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/website/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.message ?? 'Upload failed', res.status);
    }
    return data;
  },
};

// ---- Settings ----

export interface SchoolProfile {
  id: string;
  name: string;
  slug: string;
  code: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  website: string | null;
  primaryColor: string | null;
  subscription: {
    id: string;
    plan: string;
    status: string;
    seats: number;
    expiresAt: string | null;
  } | null;
}

export const settingsApi = {
  profile: () => api.get<SchoolProfile>('/settings/profile'),
  updateProfile: (payload: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    logoUrl?: string;
  }) => api.patch<SchoolProfile>('/settings/profile', payload),
  all: () => api.get<Record<string, any>>('/settings'),
  updateMany: (entries: Record<string, unknown>) =>
    api.put<{ updated: number }>('/settings', entries),
};

export const authApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ success: boolean }>('/auth/change-password', {
      currentPassword,
      newPassword,
    }),
};

// ---- Security ----

export interface AuditLogRecord {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; email: string } | null;
}

export const securityApi = {
  auditLogs: (params?: { page?: number; pageSize?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return api.get<Paginated<AuditLogRecord>>(`/security/audit-logs${qs ? `?${qs}` : ''}`);
  },
};
