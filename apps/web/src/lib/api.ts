/**
 * Minimal API client for the public website.
 * Talks to the NestJS backend at NEXT_PUBLIC_API_URL.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const message =
      (body && (body.message || body.error)) ||
      `Request failed (${res.status})`;
    throw new ApiError(Array.isArray(message) ? message.join(", ") : message, res.status);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) }),
};

// ---- Admissions ----

export interface ApplyInput {
  schoolSlug?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  programmeId?: string;
  departmentId?: string;
  // Extended personal information
  maritalStatus?: string;
  stateOfOrigin?: string;
  localGovernment?: string;
  postalAddress?: string;
  homeAddress?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianGsm?: string;
  medicalHistory?: string;
  // Course choices
  firstChoice?: string;
  secondChoice?: string;
  thirdChoice?: string;
  // Structured table data
  educationData?: {
    schools?: Array<{ schoolName: string; from: string; to: string; certificate: string }>;
    olevelResults?: Array<{ examination: string; centreNo: string; subject: string; grade: string; year: string }>;
    alevelResults?: Array<{ institution: string; from: string; to: string; programme: string; qualification: string }>;
    employmentRecords?: Array<{ employer: string; position: string; from: string; to: string }>;
  };
  // Declaration
  declarationName?: string;
  declarationDate?: string;
  declarationAgreed?: boolean;
}

export interface ApplyResult {
  id: string;
  applicationNo: string;
  status: string;
  schoolName: string;
  message: string;
}

export interface TrackResult {
  applicationNo: string;
  status: string;
  applicantName: string;
  acceptanceFeePaid: boolean;
  admissionLetterUrl: string | null;
  submittedAt: string;
  student: { matricNumber: string | null; status: string } | null;
}

export const admissionsApi = {
  apply: (input: ApplyInput) => api.post<ApplyResult>("/admissions/apply", input),
  track: (applicationNo: string, email: string) =>
    api.get<TrackResult>(
      `/admissions/track?applicationNo=${encodeURIComponent(
        applicationNo,
      )}&email=${encodeURIComponent(email)}`,
    ),
  uploadDocument: async (applicationId: string, file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await fetch(`${API_URL}/admissions/${applicationId}/documents`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Document upload failed');
    }
    return res.json();
  },
};

// ---- Website CMS (news / events / gallery / content) ----

export interface NewsPostRecord {
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

export interface GalleryItemRecord {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  caption: string | null;
  album: string | null;
  createdAt: string;
}

export interface WebsiteContentRecord {
  id: string;
  key: string;
  title: string | null;
  body: unknown;
  updatedAt: string;
}

export interface CommentRecord {
  id: string;
  newsPostId: string;
  name: string;
  text: string;
  createdAt: string;
}

export const websiteApi = {
  news: (schoolId?: string) =>
    api.get<NewsPostRecord[]>(
      `/website/news${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ""}`,
    ),
  newsBySlug: (slug: string, schoolId?: string) =>
    api.get<NewsPostRecord>(
      `/website/news/${encodeURIComponent(slug)}${
        schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ""
      }`,
    ),
  listComments: (newsPostId: string) =>
    api.get<CommentRecord[]>(`/website/news/${newsPostId}/comments`),
  createComment: (newsPostId: string, data: { name: string; text: string }) =>
    api.post<CommentRecord>(`/website/news/${newsPostId}/comments`, data),
  events: (schoolId?: string) =>
    api.get<EventRecord[]>(
      `/website/events${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ""}`,
    ),
  gallery: (schoolId?: string, album?: string) => {
    const params = new URLSearchParams();
    if (schoolId) params.set("schoolId", schoolId);
    if (album) params.set("album", album);
    const qs = params.toString();
    return api.get<GalleryItemRecord[]>(`/website/gallery${qs ? `?${qs}` : ""}`);
  },
  content: (schoolId?: string) =>
    api.get<WebsiteContentRecord[]>(
      `/website/content${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ""}`,
    ),
};

// ---- Academics (faculties / departments / programmes) ----

export interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

export interface FacultyRecord extends DepartmentRecord {
  departments: DepartmentRecord[];
}

export interface ProgrammeRecord {
  id: string;
  name: string;
  code: string;
  degreeType: string | null;
  durationYears: number;
  department: DepartmentRecord | null;
}

export const academicsApi = {
  faculties: (schoolId?: string) =>
    api.get<FacultyRecord[]>(
      `/academics/faculties${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ""}`,
    ),
  departments: (schoolId?: string, facultyId?: string) => {
    const params = new URLSearchParams();
    if (schoolId) params.set("schoolId", schoolId);
    if (facultyId) params.set("facultyId", facultyId);
    const qs = params.toString();
    return api.get<(DepartmentRecord & { faculty: FacultyRecord | null; programmes: ProgrammeRecord[] })[]>(
      `/academics/departments${qs ? `?${qs}` : ""}`,
    );
  },
  programmes: (schoolId?: string, departmentId?: string) => {
    const params = new URLSearchParams();
    if (schoolId) params.set("schoolId", schoolId);
    if (departmentId) params.set("departmentId", departmentId);
    const qs = params.toString();
    return api.get<ProgrammeRecord[]>(`/academics/programmes${qs ? `?${qs}` : ""}`);
  },
};

// ---- Staff directory (public) ----

export interface StaffDirectoryRecord {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  designation: string | null;
  email: string | null;
  isLecturer: boolean;
  department: { id: string; name: string } | null;
}

export const staffApi = {
  directory: (schoolId?: string) =>
    api.get<StaffDirectoryRecord[]>(
      `/staff/directory${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ""}`,
    ),
};

// ---- Announcements (public) ----

export interface AnnouncementRecord {
  id: string;
  title: string;
  body: string;
  audience: string | null;
  pinned: boolean;
  publishedAt: string;
  createdAt: string;
}

export const announcementsApi = {
  list: (schoolId?: string) =>
    api.get<AnnouncementRecord[]>(
      `/communication/announcements${
        schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ""
      }`,
    ),
};

// ---- Contact form ----

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
}

export interface ContactMessageResult {
  success: boolean;
  message: string;
}

export const contactApi = {
  sendMessage: (input: ContactMessageInput) =>
    api.post<ContactMessageResult>("/contact/message", input),
};
