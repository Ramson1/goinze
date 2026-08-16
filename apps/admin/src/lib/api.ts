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

function getRefreshToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )refresh_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Silently refresh the access token using the stored refresh token. */
async function refreshAccessToken(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const newAccess = data?.accessToken ?? data?.data?.accessToken;
    const newRefresh = data?.refreshToken ?? data?.data?.refreshToken;
    if (!newAccess) return false;
    const maxAge = data?.expiresIn ?? 900;
    document.cookie = `access_token=${newAccess}; path=/; max-age=${maxAge}; SameSite=Lax`;
    if (newRefresh) {
      document.cookie = `refresh_token=${newRefresh}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
    return true;
  } catch {
    return false;
  }
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

  // Auto-refresh on 401 (token expired) — retry once
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getToken();
      const retry = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          ...(init?.headers ?? {}),
        },
      });
      const text = await retry.text();
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      if (!retry.ok) {
        const message = (body && (body.message || body.error)) || `Request failed (${retry.status})`;
        throw new ApiError(Array.isArray(message) ? message.join(', ') : message, retry.status);
      }
      return body as T;
    }
  }

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
  delete: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'DELETE', body: data ? JSON.stringify(data) : undefined }),
};

// ---- Admissions ----

export interface ApplicationRecord {
  id: string;
  applicationNo: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  status: string;
  acceptanceFeePaid: boolean;
  admissionLetterUrl: string | null;
  createdAt: string;
  programmeId: string | null;
  departmentId: string | null;
  // Extended personal information
  maritalStatus: string | null;
  stateOfOrigin: string | null;
  localGovernment: string | null;
  postalAddress: string | null;
  homeAddress: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianGsm: string | null;
  medicalHistory: string | null;
  // Course choices
  firstChoice: string | null;
  secondChoice: string | null;
  thirdChoice: string | null;
  // Structured table data
  educationData: {
    schools?: Array<{ schoolName: string; from: string; to: string; certificate: string }>;
    olevelResults?: Array<{ examination: string; centreNo: string; subject: string; grade: string; year: string }>;
    alevelResults?: Array<{ institution: string; from: string; to: string; programme: string; qualification: string }>;
    employmentRecords?: Array<{ employer: string; position: string; from: string; to: string }>;
  } | null;
  // Declaration
  declarationName: string | null;
  declarationDate: string | null;
  declarationAgreed: boolean;
  // Verification checklist (Office Use Only)
  verificationDocumentsReviewed: boolean;
  verificationDocumentsMatch: boolean;
  verificationReceiptAttached: boolean;
  verificationCourseApproved: boolean;
  // Related records
  student: { id: string; matricNumber: string | null; status: string } | null;
  documents: Array<{ id: string; name: string; url: string; type: string; createdAt: string }>;
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
  get: (id: string) => api.get<ApplicationRecord>(`/admissions/${id}`),
  approve: (id: string, payload?: { programmeId?: string; departmentId?: string }) =>
    api.patch<ApplicationRecord>(`/admissions/${id}/approve`, payload ?? {}),
  reject: (id: string) =>
    api.patch<ApplicationRecord>(`/admissions/${id}/review`, { status: 'REJECTED' }),
  admit: (id: string) => api.patch<ApplicationRecord>(`/admissions/${id}/admit`),
  generateLetter: (id: string) =>
    api.post<ApplicationRecord>(`/admissions/${id}/letter`),
  sendLetterEmail: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/admissions/${id}/send-letter`),
  createStudentPassword: (id: string) =>
    api.post<{ tempPassword: string; studentId: string }>(`/admissions/${id}/create-password`),
  updateVerification: (
    id: string,
    payload: {
      verificationDocumentsReviewed?: boolean;
      verificationDocumentsMatch?: boolean;
      verificationReceiptAttached?: boolean;
      verificationCourseApproved?: boolean;
    },
  ) => api.patch<ApplicationRecord>(`/admissions/${id}/verification`, payload),
  remove: (id: string) => api.delete<{ success: boolean; message: string }>(`/admissions/${id}`),
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
  semester: string | null;
  programmeId: string | null;
  departmentId: string | null;
  isMandatory: boolean;
  allowInstallment: boolean;
  sessionId: string | null;
  session: { id: string; name: string } | null;
}

export interface StudentFeeItem {
  id: string;
  description: string;
  type: string;
  amount: number;
  status: 'PAID' | 'PENDING';
  ref: string | null;
  paidAt: string | null;
  isOptional: boolean;
  locked?: boolean;
  sessionName?: string;
  semester?: string | null;
  sessionId?: string | null;
}

export interface StudentFeeBreakdown {
  items: StudentFeeItem[];
  summary: { total: number; paid: number; outstanding: number };
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
    semester?: string;
    departmentId?: string;
    isMandatory?: boolean;
    allowInstallment?: boolean;
  }) => api.post<FeeStructure>('/finance/fee-structures', payload),
  updateFeeStructure: (id: string, payload: {
    name?: string;
    amount?: number;
    type?: string;
    level?: number;
    semester?: string;
    departmentId?: string;
    isMandatory?: boolean;
    allowInstallment?: boolean;
  }) => api.patch<FeeStructure>(`/finance/fee-structures/${id}`, payload),
  deleteFeeStructure: (id: string) =>
    request<FeeStructure>(`/finance/fee-structures/${id}`, { method: 'DELETE' }),
  refund: (paymentId: string, reason?: string) =>
    api.post<{ id: string; amount: string }>('/finance/refunds', { paymentId, reason }),
  studentFees: (studentId: string) =>
    api.get<StudentFeeBreakdown>(`/finance/student-fees/${studentId}`),
  createManualPayment: (data: {
    studentId: string;
    amount: number;
    description: string;
    feeStructureId?: string;
    reference?: string;
    narration?: string;
  }) => api.post<Payment>('/finance/payments/manual', data),
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
  courseId: string;
  sessionId: string;
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
  // Individual result actions
  updateScore: (id: string, payload: { caScore: number; examScore: number }) =>
    api.patch<AdminResultRow>(`/results/${id}`, payload),
  approveResult: (id: string) =>
    api.patch<AdminResultRow>(`/results/${id}/approve`),
  lockResult: (id: string) =>
    api.patch<AdminResultRow>(`/results/${id}/lock`),
  publishResult: (id: string) =>
    api.patch<AdminResultRow>(`/results/${id}/publish`),
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
  address: string | null;
  stateOfOrigin: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
  passportUrl: string | null;
  status: StudentStatus;
  currentLevel: number | null;
  programmeId: string | null;
  departmentId: string | null;
  tempPassword: string | null;
  programme: { id: string; name: string } | null;
  department: { id: string; name: string; code: string } | null;
  createdAt: string;
  // Populated by studentsApi.get(id) — full academic record
  payments?: StudentPayment[];
  results?: StudentResult[];
}

export interface StudentPayment {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  feeStructure: { id: string; name: string; type: string; amount: string } | null;
}

export interface StudentResult {
  id: string;
  caScore: string;
  examScore: string;
  totalScore: string;
  grade: string | null;
  gradePoint: string;
  status: string;
  semester: string;
  course: { id: string; code: string; title: string; creditUnits: number; level: number };
  session: { id: string; name: string };
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
  address?: string;
  stateOfOrigin?: string;
  nationality?: string;
  dateOfBirth?: string;
  passportUrl?: string;
}

export const studentsApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    departmentId?: string;
    level?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.departmentId) q.set('departmentId', params.departmentId);
    if (params?.level) q.set('level', String(params.level));
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
  remove: (id: string) => request<{ deleted: boolean }>(`/students/${id}`, { method: 'DELETE' }),
  promote: () => api.post<{ promoted: number }>('/students/promote'),
  graduateAll: () => api.post<{ graduated: number }>('/students/graduate-all'),
  resetPassword: (id: string) => api.post<{ tempPassword: string }>(`/students/${id}/reset-password`),
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
  staffCounts: {
    lecturers: number;
    nonAcademic: number;
    administrative: number;
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

export interface RatioPoint {
  name: string;
  students: number;
  staff: number;
}

export interface PaymentStatusPoint {
  name: string;
  count: number;
  amount: number;
}

export interface EnrollmentTrendPoint {
  month: string;
  count: number;
}

export interface StaffBreakdownPoint {
  name: string;
  lecturers: number;
  nonAcademic: number;
  administrative: number;
}

export const analyticsApi = {
  dashboard: () => api.get<DashboardSummary>('/analytics/dashboard'),
  revenueByMonth: () => api.get<RevenuePoint[]>('/analytics/revenue-by-month'),
  admissionsByMonth: () => api.get<AdmissionsPoint[]>('/analytics/admissions-by-month'),
  enrollmentByDepartment: () => api.get<NameValue[]>('/analytics/enrollment-by-department'),
  genderDistribution: () => api.get<NameValue[]>('/analytics/gender-distribution'),
  paymentMethods: () => api.get<NameValue[]>('/analytics/payment-methods'),
  staffByDepartment: () => api.get<NameValue[]>('/analytics/staff-by-department'),
  staffByCategory: () => api.get<NameValue[]>('/analytics/staff-by-category'),
  staffBreakdown: () => api.get<StaffBreakdownPoint[]>('/analytics/staff-breakdown'),
  studentStaffRatio: () => api.get<RatioPoint[]>('/analytics/student-staff-ratio'),
  paymentStatusBreakdown: () => api.get<PaymentStatusPoint[]>('/analytics/payment-status-breakdown'),
  enrollmentTrend: () => api.get<EnrollmentTrendPoint[]>('/analytics/enrollment-trend'),
  programmeEnrollment: () => api.get<NameValue[]>('/analytics/programme-enrollment'),
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
  photoUrl: string | null;
  designation: string | null;
  salaryGrade: string | null;
  employmentType: string | null;
  employmentDate: string | null;
  qualification: string | null;
  isLecturer: boolean;
  isActive: boolean;
  staffCategory: string | null;
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
  staffCategory?: string;
  photoUrl?: string;
}

export const staffApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    departmentId?: string;
    isLecturer?: string;
    staffCategory?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.search) q.set('search', params.search);
    if (params?.departmentId) q.set('departmentId', params.departmentId);
    if (params?.isLecturer) q.set('isLecturer', params.isLecturer);
    if (params?.staffCategory) q.set('staffCategory', params.staffCategory);
    const qs = q.toString();
    return api.get<Paginated<StaffRecord>>(`/staff${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => api.get<StaffRecord>(`/staff/${id}`),
  create: (payload: StaffInput) => api.post<StaffRecord>('/staff', payload),
  update: (id: string, payload: Partial<StaffInput>) =>
    api.patch<StaffRecord>(`/staff/${id}`, payload),
  remove: (id: string) => request<{ deleted: boolean }>(`/staff/${id}`, { method: 'DELETE' }),
  toggleActive: (id: string) => api.patch<StaffRecord>(`/staff/${id}/toggle-active`),
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
  updateDepartment: (
    id: string,
    payload: {
      name: string;
      code: string;
      facultyId?: string;
      description?: string;
    },
  ) => api.put<DepartmentFull>(`/academics/departments/${id}`, payload),
  deleteDepartment: (id: string) =>
    api.delete<void>(`/academics/departments/${id}`),
  programmes: () => api.get<Programme[]>('/academics/programmes'),
  createProgramme: (payload: {
    departmentId: string;
    name: string;
    code: string;
    degreeType?: string;
    durationYears?: number;
  }) => api.post<Programme>('/academics/programmes', payload),
  updateProgramme: (id: string, payload: {
    name?: string;
    code?: string;
    degreeType?: string;
    durationYears?: number;
  }) => api.put<Programme>(`/academics/programmes/${id}`, payload),
  deleteProgramme: (id: string) => api.delete<void>(`/academics/programmes/${id}`),
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
  updateCourse: (id: string, payload: {
    code?: string;
    title?: string;
    departmentId?: string;
    creditUnits?: number;
    level?: number;
    semester?: string;
    description?: string;
  }) => api.put<CourseRecord>(`/academics/courses/${id}`, payload),
  deleteCourse: (id: string) => api.delete<void>(`/academics/courses/${id}`),
  allocations: (courseId: string) =>
    api.get<CourseAllocation[]>(`/academics/courses/${courseId}/allocations`),
  updateAllocation: (courseId: string, staffId: string) =>
    api.put<CourseAllocation | null>(`/academics/courses/${courseId}/allocation`, { staffId }),
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
  update: (id: string, payload: {
    name?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
  }) => api.patch<AcademicSessionRecord>(`/academics/sessions/${id}`, payload),
  remove: (id: string) =>
    api.delete<{ deleted: boolean }>(`/academics/sessions/${id}`),
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
  updateAnnouncement: (id: string, payload: {
    title?: string;
    body?: string;
    audience?: string;
    pinned?: boolean;
  }) => api.patch<AnnouncementRecord>(`/communication/announcements/${id}`, payload),
  deleteAnnouncement: (id: string) =>
    api.delete<{ success: boolean }>(`/communication/announcements/${id}`),
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
  update: (id: string, payload: {
    title?: string;
    body?: string;
    category?: string;
    excerpt?: string;
    coverUrl?: string;
    published?: boolean;
  }) => api.patch<NewsRecord>(`/website/news/${id}`, payload),
  delete: (id: string) => api.delete<{ success: boolean }>(`/website/news/${id}`),
  setPublished: (id: string, published: boolean) =>
    api.patch<NewsRecord>(`/website/news/${id}/publish`, { published }),
  listComments: (newsPostId: string) =>
    api.get<CommentRecord[]>(`/website/news/${newsPostId}/comments`),
  createComment: (newsPostId: string, data: { name: string; text: string }) =>
    api.post<CommentRecord>(`/website/news/${newsPostId}/comments`, data),
  updateComment: (id: string, data: { name?: string; text?: string }) =>
    api.patch<CommentRecord>(`/website/comments/${id}`, data),
  deleteComment: (id: string) => api.delete<{ success: boolean }>(`/website/comments/${id}`),
};

export interface CommentRecord {
  id: string;
  newsPostId: string;
  name: string;
  text: string;
  createdAt: string;
}

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
  update: (id: string, payload: {
    title?: string;
    description?: string;
    location?: string;
    startsAt?: string;
    endsAt?: string;
  }) => api.patch<EventRecord>(`/website/events/${id}`, payload),
  delete: (id: string) => api.delete<{ success: boolean }>(`/website/events/${id}`),
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

export interface ExamAccessCodeRecord {
  id: string;
  code: string;
  usedBy: { id: string; firstName: string; lastName: string; email: string } | null;
  usedAt: string | null;
  createdAt: string;
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
  getExam: (id: string) => api.get<CbtExamRecord & { questions: any[] }>(`/cbt/exams/${id}`),
  createExam: (payload: CbtExamInput) => api.post<CbtExamRecord>('/cbt/exams', payload),
  setExamStatus: (id: string, status: CbtExamStatus) =>
    api.patch<CbtExamRecord>(`/cbt/exams/${id}/status`, { status }),
  addExamQuestions: (examId: string, questionIds: string[]) =>
    api.post<{ count: number }>(`/cbt/exams/${examId}/questions`, { questionIds }),
  removeExamQuestions: (examId: string, questionIds: string[]) =>
    api.delete<{ count: number }>(`/cbt/exams/${examId}/questions`, { questionIds }),
  examAttempts: (examId: string) =>
    api.get<CbtAttemptRecord[]>(`/cbt/exams/${examId}/attempts`),
  generateCodes: (examId: string) =>
    api.post<{ count: number }>(`/cbt/exams/${examId}/access-codes`),
  listCodes: (examId: string) =>
    api.get<ExamAccessCodeRecord[]>(`/cbt/exams/${examId}/access-codes`),
  bulkCreateQuestions: (payload: {
    bankId: string;
    questions: {
      type?: string;
      text: string;
      marks?: number;
      difficulty?: string;
      explanation?: string;
      options?: { text: string; isCorrect?: boolean }[];
    }[];
  }) => api.post<{ count: number }>('/cbt/questions/bulk', payload),
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
  deleteContent: (key: string) =>
    api.delete<WebsiteContentRecord>(`/website/content/${encodeURIComponent(key)}`),
  gallery: () => api.get<GalleryItemRecord[]>('/website/gallery'),
  addGalleryItem: (payload: { url: string; type?: string; caption?: string; album?: string }) =>
    api.post<GalleryItemRecord>('/website/gallery', payload),
  updateGalleryItem: (id: string, payload: { url?: string; type?: string; caption?: string; album?: string }) =>
    api.patch<GalleryItemRecord>(`/website/gallery/${id}`, payload),
  deleteGalleryItem: (id: string) =>
    api.delete<GalleryItemRecord>(`/website/gallery/${id}`),
  /** Upload a file to Cloudinary and return the hosted URL. */
  uploadMedia: async (file: File): Promise<{ url: string; publicId: string }> => {
    async function doUpload(token: string | null) {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${API_URL}/website/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
    }

    let res = await doUpload(getToken());

    // Auto-refresh on 401 — retry once
    if (res.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        res = await doUpload(getToken());
      }
    }

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.message ?? 'Upload failed', res.status);
    }
    if (data?.error) {
      throw new ApiError(data.error, 400);
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
  me: () => api.get<{ id: string; email: string; firstName: string; lastName: string; role: string; avatarUrl?: string | null }>('/auth/me'),
    updateProfile: (data: { firstName?: string; lastName?: string; email?: string; avatarUrl?: string }) =>
    api.patch<{ id: string; email: string; firstName: string; lastName: string; role: string; avatarUrl?: string | null }>('/auth/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ success: boolean }>('/auth/change-password', {
      currentPassword,
      newPassword,
    }),
};

// ---- Notifications ----

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  channel: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
  createdAt: string;
}

export const notificationApi = {
  list: () => api.get<NotificationRecord[]>('/communication/notifications'),
  markRead: (id: string) =>
    api.patch<NotificationRecord>(`/communication/notifications/${id}/read`),
};

// ---- Conversations / Messaging ----

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
  participants: { id: string; userId: string; user: { id: string; firstName: string; lastName: string; role?: string; avatarUrl?: string | null } }[];
  messages: MessageItem[];
}

export interface MessageItem {
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

export const conversationApi = {
  list: () => api.get<ConversationSummary[]>('/communication/conversations'),
  get: (id: string) => api.get<ConversationDetail>(`/communication/conversations/${id}`),
  create: (data: { recipientIds: string[]; title?: string; isGroup?: boolean }) =>
    api.post<ConversationDetail>('/communication/conversations', data),
  messages: (id: string) => api.get<MessageItem[]>(`/communication/conversations/${id}/messages`),
  sendMessage: (id: string, data: { body: string; replyToId?: string }) =>
    api.post<MessageItem>(`/communication/conversations/${id}/messages`, data),
  editMessage: (id: string, body: string) =>
    api.patch<MessageItem>(`/communication/messages/${id}`, { body }),
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

// ---- Digital ID Cards ----

export interface IdCardRecord {
  id: string;
  schoolId: string;
  type: 'STUDENT' | 'STAFF';
  studentId: string | null;
  staffId: string | null;
  cardNumber: string;
  qrData: string;
  barcode: string | null;
  verificationCode: string;
  photoUrl: string | null;
  pdfUrl: string | null;
  issuedAt: string;
  expiresAt: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  student?: { id: string; firstName: string; lastName: string; passportUrl: string | null } | null;
  staff?: { id: string; firstName: string; lastName: string; photoUrl: string | null } | null;
}

export const idCardsApi = {
  list: (type?: string) =>
    api.get<IdCardRecord[]>(`/id-cards${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  generate: (data: { type: 'STUDENT' | 'STAFF'; studentId?: string; staffId?: string }) =>
    api.post<IdCardRecord>('/id-cards', data),
  batchGenerate: (data: { type: 'STUDENT' | 'STAFF'; studentIds?: string[]; staffIds?: string[] }) =>
    api.post<IdCardRecord[]>('/id-cards/batch', data),
  statusMap: () =>
    api.get<Record<string, IdCardRecord>>('/id-cards/status'),
  revoke: (id: string) =>
    api.patch<IdCardRecord>(`/id-cards/${id}/revoke`),
};
