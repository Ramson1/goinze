import { Injectable, NotFoundException } from '@nestjs/common';
import type { Paginated } from '@goinze/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { paginated } from '../common/utils/pagination.util';
import { PaginationDto } from '../common/dto/pagination.dto';

/**
 * Academic management: faculties, departments, programmes, sessions,
 * courses and course allocations — grouped under a single service.
 */
@Injectable()
export class AcademicsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Faculties ----
  listFaculties(schoolId: string | null) {
    return this.prisma.db.faculty.findMany({
      where: schoolId ? { schoolId } : {},
      include: { departments: true },
      orderBy: { name: 'asc' },
    });
  }

  createFaculty(schoolId: string | null, data: Record<string, any>) {
    return this.prisma.db.faculty.create({
      data: { schoolId: schoolId ?? '', name: data.name, code: data.code },
    });
  }

  // ---- Departments ----
  listDepartments(schoolId: string | null, facultyId?: string) {
    const where: Record<string, any> = {};
    if (schoolId) where.schoolId = schoolId;
    if (facultyId) where.facultyId = facultyId;
    return this.prisma.db.department.findMany({
      where,
      include: { faculty: true, programmes: true },
      orderBy: { name: 'asc' },
    });
  }

  createDepartment(schoolId: string | null, data: Record<string, any>) {
    return this.prisma.db.department.create({
      data: {
        schoolId: schoolId ?? '',
        facultyId: data.facultyId,
        name: data.name,
        code: data.code,
        description: data.description,
      },
    });
  }

  // ---- Programmes ----
  listProgrammes(schoolId: string | null, departmentId?: string) {
    const where: Record<string, any> = {};
    if (schoolId) where.schoolId = schoolId;
    if (departmentId) where.departmentId = departmentId;
    return this.prisma.db.programme.findMany({
      where,
      include: { department: true },
      orderBy: { name: 'asc' },
    });
  }

  createProgramme(schoolId: string | null, data: Record<string, any>) {
    return this.prisma.db.programme.create({
      data: {
        schoolId: schoolId ?? '',
        departmentId: data.departmentId,
        name: data.name,
        code: data.code,
        degreeType: data.degreeType,
        durationYears: data.durationYears ?? 4,
      },
    });
  }

  // ---- Sessions ----
  listSessions(schoolId: string | null) {
    return this.prisma.db.academicSession.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { name: 'desc' },
    });
  }

  async createSession(schoolId: string | null, data: Record<string, any>) {
    // Marking a session current unsets all others for the school.
    if (data.isCurrent && schoolId) {
      await this.prisma.db.academicSession.updateMany({
        where: { schoolId },
        data: { isCurrent: false },
      });
    }
    return this.prisma.db.academicSession.create({
      data: {
        schoolId: schoolId ?? '',
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isCurrent: Boolean(data.isCurrent),
      },
    });
  }

  /** Set a session as the current one, unsetting all others for the school. */
  async activateSession(schoolId: string | null, id: string) {
    const session = await this.prisma.db.academicSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (schoolId) {
      await this.prisma.db.academicSession.updateMany({
        where: { schoolId },
        data: { isCurrent: false },
      });
    }
    return this.prisma.db.academicSession.update({
      where: { id },
      data: { isCurrent: true },
    });
  }

  // ---- Courses ----
  async listCourses(
    schoolId: string | null,
    query: PaginationDto,
    filters: { departmentId?: string; level?: number; semester?: string } = {},
  ): Promise<Paginated<any>> {
    const where: Record<string, any> = {};
    if (schoolId) where.schoolId = schoolId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.level) where.level = filters.level;
    if (filters.semester) where.semester = filters.semester;
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return paginated(this.prisma.db.course, {
      where,
      page: query.page,
      pageSize: query.pageSize,
      include: { department: true, allocations: { include: { staff: true } } },
    });
  }

  createCourse(schoolId: string | null, data: Record<string, any>) {
    return this.prisma.db.course.create({
      data: {
        schoolId: schoolId ?? '',
        departmentId: data.departmentId,
        code: data.code,
        title: data.title,
        creditUnits: data.creditUnits ?? 3,
        level: data.level ?? 100,
        semester: (data.semester as any) ?? 'FIRST',
        description: data.description,
      },
    });
  }

  async getCourse(id: string) {
    const course = await this.prisma.db.course.findUnique({
      where: { id },
      include: { department: true, allocations: { include: { staff: true } } },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  // ---- Course allocation ----
  allocateCourse(data: {
    courseId: string;
    staffId: string;
    sessionId?: string;
  }) {
    return this.prisma.db.courseAllocation.create({
      data: {
        courseId: data.courseId,
        staffId: data.staffId,
        sessionId: data.sessionId,
      },
    });
  }

  listAllocations(courseId: string) {
    return this.prisma.db.courseAllocation.findMany({
      where: { courseId },
      include: { staff: true, course: true },
    });
  }
}
