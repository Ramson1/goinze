import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { Paginated } from '@goinze/shared-types';
import { generateApplicationNo, generateMatricNumber } from '@goinze/shared-utils';
import { PrismaService } from '../prisma/prisma.service';
import { paginated } from '../common/utils/pagination.util';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApplyDto, ReviewApplicationDto } from './dto/admission.dto';

@Injectable()
export class AdmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit a new application from the public website.
   * Resolves the target school (tenant) from slug/code, falling back to the
   * first active school in development so the demo flow works out of the box.
   */
  async apply(schoolId: string | null, dto: ApplyDto) {
    const school = await this.resolveSchool(schoolId, dto.schoolSlug, dto.schoolCode);

    const application = await this.prisma.db.application.create({
      data: {
        schoolId: school.id,
        applicationNo: generateApplicationNo(),
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        middleName: dto.middleName?.trim() || undefined,
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone,
        gender: (dto.gender as any) ?? undefined,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        programmeId: dto.programmeId || undefined,
        departmentId: dto.departmentId || undefined,
        // Extended personal information
        maritalStatus: dto.maritalStatus || undefined,
        stateOfOrigin: dto.stateOfOrigin || undefined,
        localGovernment: dto.localGovernment || undefined,
        postalAddress: dto.postalAddress || undefined,
        homeAddress: dto.homeAddress || undefined,
        guardianName: dto.guardianName || undefined,
        guardianPhone: dto.guardianPhone || undefined,
        guardianGsm: dto.guardianGsm || undefined,
        medicalHistory: dto.medicalHistory || undefined,
        // Course choices
        firstChoice: dto.firstChoice || undefined,
        secondChoice: dto.secondChoice || undefined,
        thirdChoice: dto.thirdChoice || undefined,
        // Structured table data
        educationData: dto.educationData ?? undefined,
        // Declaration
        declarationName: dto.declarationName || undefined,
        declarationDate: dto.declarationDate ? new Date(dto.declarationDate) : undefined,
        declarationAgreed: dto.declarationAgreed ?? false,
        status: 'SUBMITTED',
      },
      include: { documents: false },
    });

    return {
      id: application.id,
      applicationNo: application.applicationNo,
      status: application.status,
      schoolName: school.name,
      message:
        'Application received. Use your application number and email to track its status.',
    };
  }

  /**
   * Public status lookup for applicants (no auth).
   * Requires the matching email to prevent enumeration of other applicants.
   */
  async trackStatus(applicationNo: string, email: string) {
    const application = await this.prisma.db.application.findUnique({
      where: { applicationNo: applicationNo.trim().toUpperCase() },
      include: {
        student: {
          select: {
            id: true,
            matricNumber: true,
            status: true,
            currentLevel: true,
          },
        },
      },
    });

    if (
      !application ||
      application.email.toLowerCase() !== email.toLowerCase().trim()
    ) {
      throw new NotFoundException(
        'No application found for that application number and email.',
      );
    }

    return {
      applicationNo: application.applicationNo,
      status: application.status,
      applicantName: `${application.firstName} ${application.lastName}`,
      acceptanceFeePaid: application.acceptanceFeePaid,
      admissionLetterUrl: application.admissionLetterUrl,
      submittedAt: application.createdAt,
      student: application.student
        ? {
            matricNumber: application.student.matricNumber,
            status: application.student.status,
          }
        : null,
    };
  }

  async findAll(
    schoolId: string | null,
    query: PaginationDto,
    status?: string,
  ): Promise<Paginated<any>> {
    const where: Record<string, any> = {};
    if (schoolId) where.schoolId = schoolId;
    if (status) where.status = status;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { applicationNo: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return paginated(this.prisma.db.application, {
      where,
      page: query.page,
      pageSize: query.pageSize,
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const application = await this.prisma.db.application.findUnique({
      where: { id },
      include: { documents: true, student: true, payments: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  /** Move an application through the review workflow. */
  async review(id: string, reviewerId: string, dto: ReviewApplicationDto) {
    await this.findOne(id);
    return this.prisma.db.application.update({
      where: { id },
      data: {
        status: dto.status as any,
        score: dto.score ?? undefined,
        interviewDate: dto.interviewDate ? new Date(dto.interviewDate) : undefined,
        reviewedBy: reviewerId,
      },
    });
  }

  /**
   * Approve an application and provision a Student record with a matric number.
   * Idempotent: re-approving an already-provisioned application just refreshes
   * the status without creating a duplicate student.
   */
  async approve(id: string, reviewerId: string) {
    const application = await this.findOne(id);

    if (application.status === 'REJECTED') {
      throw new BadRequestException('A rejected application cannot be approved.');
    }

    if (application.studentId) {
      return this.prisma.db.application.update({
        where: { id },
        data: { status: 'APPROVED', reviewedBy: reviewerId },
        include: { student: true },
      });
    }

    const [matricNumber, currentSession] = await Promise.all([
      this.generateMatricNumber(application.schoolId, application.departmentId),
      this.prisma.db.academicSession.findFirst({
        where: { schoolId: application.schoolId, isCurrent: true },
      }),
    ]);

    return this.prisma.db.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          schoolId: application.schoolId,
          firstName: application.firstName,
          lastName: application.lastName,
          middleName: application.middleName,
          gender: application.gender ?? undefined,
          dateOfBirth: application.dateOfBirth ?? undefined,
          email: application.email,
          phone: application.phone,
          programmeId: application.programmeId,
          departmentId: application.departmentId,
          matricNumber,
          currentLevel: 100,
          entrySessionId: currentSession?.id,
          status: 'APPLICANT',
        },
      });

      // Provision a portal login for the newly admitted student.
      await this.provisionStudentUser(tx, student.id, application);

      return tx.application.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: reviewerId,
          studentId: student.id,
        },
        include: { student: true },
      });
    });
  }

  /** Default password for provisioned student accounts (change on first login). */
  static readonly DEFAULT_STUDENT_PASSWORD = 'student123';

  /**
   * Create a STUDENT-role User linked to a Student record so the applicant can
   * log in to the student portal. Idempotent: skips if the email is taken.
   */
  private async provisionStudentUser(
    tx: any,
    studentId: string,
    application: { schoolId: string; email: string; firstName: string; lastName: string; phone: string | null },
  ) {
    const existing = await tx.user.findUnique({
      where: { email: application.email.toLowerCase() },
      include: { student: true },
    });
    if (existing) {
      // Link the existing account to the student if not already linked.
      if (!existing.student) {
        await tx.student.update({
          where: { id: studentId },
          data: { userId: existing.id },
        });
      }
      return;
    }

    const passwordHash = await bcrypt.hash(
      AdmissionsService.DEFAULT_STUDENT_PASSWORD,
      10,
    );
    const user = await tx.user.create({
      data: {
        schoolId: application.schoolId,
        email: application.email.toLowerCase(),
        passwordHash,
        firstName: application.firstName,
        lastName: application.lastName,
        phone: application.phone ?? undefined,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    // Link student → user (FK lives on Student.userId).
    await tx.student.update({
      where: { id: studentId },
      data: { userId: user.id },
    });
  }

  /**
   * Finalize onboarding once the acceptance fee is paid: flip the application
   * to ADMITTED and activate the provisioned student. Guarded so it only runs
   * when both approval and payment are satisfied.
   */
  async admit(id: string) {
    const application = await this.findOne(id);

    if (!application.studentId) {
      throw new BadRequestException(
        'Approve the application (provision a student) before admitting.',
      );
    }
    if (!application.acceptanceFeePaid) {
      throw new BadRequestException(
        'Acceptance fee has not been paid. Payment is required before admission.',
      );
    }

    return this.prisma.db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: application.studentId! },
        data: { status: 'ACTIVE' },
      });
      return tx.application.update({
        where: { id },
        data: { status: 'ADMITTED' },
        include: { student: true },
      });
    });
  }

  /**
   * Generate the admission letter as a self-contained HTML document and store
   * it as a data URL. (Swap for Cloudinary-hosted PDF in production.)
   */
  async generateLetter(id: string) {
    const application = await this.findOne(id);
    if (application.status !== 'APPROVED' && application.status !== 'ADMITTED') {
      throw new BadRequestException(
        'Only approved applications can have an admission letter generated.',
      );
    }

    const [school, programme, department] = await Promise.all([
      this.prisma.db.school.findUnique({ where: { id: application.schoolId } }),
      application.programmeId
        ? this.prisma.db.programme.findUnique({
            where: { id: application.programmeId },
          })
        : Promise.resolve(null),
      application.departmentId
        ? this.prisma.db.department.findUnique({
            where: { id: application.departmentId },
          })
        : Promise.resolve(null),
    ]);

    const html = this.renderLetterHtml({
      schoolName: school?.name ?? 'Goinze International School of Medical Health Science and Technology',
      schoolAddress: school?.address ?? '',
      applicationNo: application.applicationNo,
      applicantName: [application.firstName, application.middleName, application.lastName]
        .filter(Boolean)
        .join(' '),
      programme: programme?.name ?? '—',
      department: department?.name ?? '—',
      matricNumber: application.student?.matricNumber ?? 'Pending',
      date: new Date().toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    });

    const admissionLetterUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    return this.prisma.db.application.update({
      where: { id },
      data: { admissionLetterUrl },
      include: { student: true },
    });
  }

  // ---- helpers ----

  private async resolveSchool(
    schoolId: string | null,
    slug?: string,
    code?: string,
  ) {
    if (schoolId) {
      const school = await this.prisma.db.school.findUnique({ where: { id: schoolId } });
      if (school) return school;
    }
    if (slug) {
      const school = await this.prisma.db.school.findUnique({ where: { slug } });
      if (school) return school;
    }
    if (code) {
      const school = await this.prisma.db.school.findUnique({ where: { code } });
      if (school) return school;
    }
    // Dev/demo fallback: the first active school.
    const fallback = await this.prisma.db.school.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!fallback) {
      throw new BadRequestException(
        'No school configured. Seed a school or pass schoolSlug/schoolCode.',
      );
    }
    return fallback;
  }

  private async generateMatricNumber(schoolId: string, departmentId: string | null) {
    const [school, department, serial] = await Promise.all([
      this.prisma.db.school.findUnique({ where: { id: schoolId } }),
      departmentId
        ? this.prisma.db.department.findUnique({ where: { id: departmentId } })
        : Promise.resolve(null),
      this.prisma.db.student.count({
        where: { schoolId, departmentId: departmentId ?? undefined },
      }),
    ]);

    return generateMatricNumber(
      school?.code ?? 'GDU',
      department?.code ?? 'GEN',
      serial + 1,
    );
  }

  private renderLetterHtml(d: {
    schoolName: string;
    schoolAddress: string;
    applicationNo: string;
    applicantName: string;
    programme: string;
    department: string;
    matricNumber: string;
    date: string;
  }): string {
    return `<!doctype html><html><head><meta charset="utf-8"><title>Admission Letter — ${d.applicantName}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#1e293b;margin:0;padding:48px;background:#fff;}
  .sheet{max-width:760px;margin:0 auto;border:1px solid #e2e8f0;padding:56px;}
  .head{text-align:center;border-bottom:3px solid #0f766e;padding-bottom:20px;margin-bottom:28px;}
  .head h1{color:#0f766e;margin:0;font-size:26px;letter-spacing:.5px;}
  .head p{margin:6px 0 0;color:#64748b;font-size:13px;}
  .ref{font-size:13px;color:#64748b;margin-bottom:24px;}
  h2{color:#0f766e;font-size:18px;text-decoration:underline;}
  table{width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;}
  td{padding:8px 10px;border:1px solid #e2e8f0;}
  td.k{background:#f0fdfa;font-weight:bold;width:38%;color:#0f766e;}
  .sign{margin-top:48px;font-size:14px;}
  .foot{margin-top:40px;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:14px;}
</style></head><body><div class="sheet">
  <div class="head"><h1>${d.schoolName}</h1><p>${d.schoolAddress}</p><p>Office of the Registrar — Admissions</p></div>
  <div class="ref">Reference: ${d.applicationNo} &nbsp;|&nbsp; Date: ${d.date}</div>
  <p>Dear <strong>${d.applicantName}</strong>,</p>
  <h2>Offer of Provisional Admission</h2>
  <p>We are pleased to inform you that, following the review of your application, you have been offered <strong>provisional admission</strong> into the programme below, subject to payment of the acceptance fee and completion of registration.</p>
  <table>
    <tr><td class="k">Applicant</td><td>${d.applicantName}</td></tr>
    <tr><td class="k">Application No.</td><td>${d.applicationNo}</td></tr>
    <tr><td class="k">Programme</td><td>${d.programme}</td></tr>
    <tr><td class="k">Department</td><td>${d.department}</td></tr>
    <tr><td class="k">Matric Number</td><td>${d.matricNumber}</td></tr>
  </table>
  <p>To accept this offer, kindly pay the acceptance fee through the student portal. Your admission will be confirmed and your matric number activated upon receipt of payment.</p>
  <p>Congratulations, and welcome to ${d.schoolName}.</p>
  <div class="sign"><p>Yours faithfully,</p><p><strong>The Registrar</strong><br/>${d.schoolName}</p></div>
  <div class="foot">This is a system-generated admission letter • Verify at the school portal using reference ${d.applicationNo}</div>
</div></body></html>`;
  }
}
