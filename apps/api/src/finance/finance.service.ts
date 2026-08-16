import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type { Paginated } from '@goinze/shared-types';
import { generatePaymentRef, generateReceiptNumber, generateVerificationCode } from '@goinze/shared-utils';
import { PrismaService } from '../prisma/prisma.service';
import { paginated } from '../common/utils/pagination.util';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FlutterwaveGateway } from './flutterwave.gateway';
import {
  CreateFeeStructureDto,
  UpdateFeeStructureDto,
  InitPaymentDto,
  VerifyPaymentDto,
  RefundDto,
  CreateScholarshipDto,
} from './dto/finance.dto';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: FlutterwaveGateway,
    private readonly config: ConfigService,
  ) {}

  // ---- Fee structures ----
  listFeeStructures(schoolId: string | null) {
    return this.prisma.db.feeStructure.findMany({
      where: schoolId ? { schoolId } : {},
      include: { session: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createFeeStructure(schoolId: string | null, dto: CreateFeeStructureDto) {
    return this.prisma.db.feeStructure.create({
      data: {
        schoolId: schoolId ?? '',
        name: dto.name,
        type: (dto.type as any) ?? 'SCHOOL',
        amount: dto.amount,
        sessionId: dto.sessionId,
        level: dto.level,
        semester: dto.semester as any,
        programmeId: dto.programmeId,
        departmentId: dto.departmentId,
        isMandatory: dto.isMandatory ?? true,
        allowInstallment: dto.allowInstallment ?? false,
      },
    });
  }

  async updateFeeStructure(id: string, schoolId: string | null, dto: UpdateFeeStructureDto) {
    const existing = await this.prisma.db.feeStructure.findUnique({ where: { id } });
    if (!existing || (schoolId && existing.schoolId !== schoolId)) {
      throw new NotFoundException('Fee structure not found');
    }
    return this.prisma.db.feeStructure.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type as any }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.sessionId !== undefined && { sessionId: dto.sessionId }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.semester !== undefined && { semester: dto.semester as any }),
        ...(dto.programmeId !== undefined && { programmeId: dto.programmeId }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.isMandatory !== undefined && { isMandatory: dto.isMandatory }),
        ...(dto.allowInstallment !== undefined && { allowInstallment: dto.allowInstallment }),
      },
    });
  }

  async deleteFeeStructure(id: string, schoolId: string | null) {
    const existing = await this.prisma.db.feeStructure.findUnique({ where: { id } });
    if (!existing || (schoolId && existing.schoolId !== schoolId)) {
      throw new NotFoundException('Fee structure not found');
    }
    return this.prisma.db.feeStructure.delete({ where: { id } });
  }

  // ---- Payments ----
  async listPayments(
    schoolId: string | null,
    query: PaginationDto,
    status?: string,
  ): Promise<Paginated<any>> {
    const where: Record<string, any> = {};
    if (schoolId) where.schoolId = schoolId;
    if (status) where.status = status;
    if (query.search) {
      where.reference = { contains: query.search, mode: 'insensitive' };
    }
    const result = await paginated(this.prisma.db.payment, {
      where,
      page: query.page,
      pageSize: query.pageSize,
      include: {
        student: true,
        feeStructure: true,
        receipt: true,
        application: {
          include: {
            student: true,
          },
        },
      },
    });

    // Resolve student from application when direct student is null
    result.items = result.items.map((p: any) => {
      if (!p.student && p.application?.student) {
        p.student = p.application.student;
      }
      return p;
    });

    return result;
  }

  /**
   * Initialize a payment record in the DB and return the reference.
   * The frontend uses this reference with Flutterwave inline checkout,
   * which creates its own transaction on Flutterwave with the correct
   * customer email. We do NOT call gateway.initialize() here because
   * that would create a server-side transaction whose merchant context
   * overrides the customer email in the inline checkout.
   */
  async initPayment(schoolId: string | null, dto: InitPaymentDto) {
    const reference = generatePaymentRef();

    // Resolve a customer email + owning school from the application or student
    // so unauthenticated applicants can pay the acceptance fee.
    let resolvedSchoolId = schoolId;
    if (dto.applicationId) {
      const app = await this.prisma.db.application.findUnique({
        where: { id: dto.applicationId },
      });
      resolvedSchoolId = resolvedSchoolId ?? app?.schoolId ?? null;
    }
    if (!resolvedSchoolId && dto.studentId) {
      const student = await this.prisma.db.student.findUnique({
        where: { id: dto.studentId },
      });
      resolvedSchoolId = resolvedSchoolId ?? student?.schoolId ?? null;
    }

    // Fall back to resolving the school from the slug (website admission flow)
    if (!resolvedSchoolId && dto.schoolSlug) {
      const school = await this.prisma.db.school.findFirst({
        where: { slug: dto.schoolSlug },
      });
      resolvedSchoolId = school?.id ?? null;
    }

    if (!resolvedSchoolId) {
      throw new BadRequestException(
        'Unable to resolve a school for this payment. Provide an applicationId, studentId, or schoolSlug.',
      );
    }

    const payment = await this.prisma.db.payment.create({
      data: {
        schoolId: resolvedSchoolId,
        studentId: dto.studentId,
        applicationId: dto.applicationId,
        feeStructureId: dto.feeStructureId,
        reference,
        amount: dto.amount,
        currency: dto.currency ?? 'NGN',
        gateway: (dto.gateway as any) ?? 'FLUTTERWAVE',
        status: 'PENDING',
        metadata: dto.purpose ? { purpose: dto.purpose } : undefined,
      },
    });

    // Return just the DB record and reference.
    // The frontend will use Flutterwave inline checkout with this reference,
    // passing the customer email directly to Flutterwave.
    return { payment, reference, checkoutUrl: '', live: this.gateway.isConfigured };
  }

  /**
   * Verify a payment by reference, mark it successful, post a ledger credit,
   * and — for acceptance-fee payments — advance the linked application.
   */
  async verifyPayment(dto: VerifyPaymentDto) {
    const payment = await this.prisma.db.payment.findUnique({
      where: { reference: dto.reference },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    // Already verified — return existing data with receipt
    if (payment.status === 'SUCCESS') {
      const existingReceipt = await this.prisma.db.receipt.findUnique({
        where: { paymentId: payment.id },
      });
      return { ...payment, receipt: existingReceipt };
    }

    const result = await this.gateway.verify(dto.reference);
    if (result.status !== 'successful') {
      throw new BadRequestException(
        `Payment not successful (gateway status: ${result.status}).`,
      );
    }

    // Use a transaction to prevent duplicate processing from concurrent webhooks
    const updated = await this.prisma.db.$transaction(async (tx) => {
      // Re-check status inside transaction (optimistic locking)
      const fresh = await tx.payment.findUnique({ where: { id: payment.id } });
      if (fresh?.status === 'SUCCESS') {
        return { ...fresh, alreadyProcessed: true };
      }

      const pay = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          gatewayRef: result.flwRef || dto.gatewayRef,
          paidAt: new Date(),
        },
      });

      // Credit the student ledger when applicable
      if (pay.studentId) {
        await tx.ledgerEntry.create({
          data: {
            studentId: pay.studentId,
            paymentId: pay.id,
            credit: Number(pay.amount),
            balance: Number(pay.amount),
            narration: `Payment ${pay.reference}`,
          },
        });
      }

      // Application form fee flow
      const purpose = (pay.metadata as any)?.purpose;
      if (pay.applicationId && (purpose === 'APPLICATION_FORM' || purpose === 'ENTRANCE_EXAM')) {
        await tx.application.update({
          where: { id: pay.applicationId },
          data: { applicationFormFeePaid: true },
        });
      }

      // Acceptance-fee flow
      if (pay.applicationId && purpose !== 'APPLICATION_FORM' && purpose !== 'ENTRANCE_EXAM') {
        await this.onAcceptanceFeePaid(pay.applicationId, tx);
      }

      // Auto-generate receipt
      const receipt = await tx.receipt.create({
        data: {
          paymentId: pay.id,
          receiptNumber: generateReceiptNumber(),
          verificationCode: generateVerificationCode(),
          qrData: `goinzeschool://receipt/${generateVerificationCode()}`,
        },
      });

      return { ...pay, receipt };
    });

    return updated;
  }

  /**
   * Handle a successful acceptance-fee payment for an application:
   * flag it paid, then finalize admission if the application is approved.
   */
  private async onAcceptanceFeePaid(applicationId: string, tx?: any) {
    const db = tx ?? this.prisma.db;
    const application = await db.application.update({
      where: { id: applicationId },
      data: { acceptanceFeePaid: true },
    });

    if (application.status === 'APPROVED' && application.studentId) {
      await Promise.all([
        db.student.update({
          where: { id: application.studentId },
          data: { status: 'ACTIVE' },
        }),
        db.application.update({
          where: { id: applicationId },
          data: { status: 'ADMITTED' },
        }),
      ]);
    }
  }

  /** Process a Flutterwave webhook event (charge.completed). */
  async handleWebhook(payload: any, signature?: string) {
    // Verify webhook signature if FLUTTERWAVE_WEBHOOK_HASH is configured
    const webhookHash = this.gateway.webhookHash;
    if (webhookHash) {
      if (!signature) {
        this.logger.warn('Webhook received without verifi-hash header');
        throw new UnauthorizedException('Missing webhook signature');
      }
      // Flutterwave sends a SHA256 hash of the payload as the verifi-hash
      const expectedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(payload))
        .digest('hex');
      // Also check against the configured secret hash
      if (signature !== webhookHash && signature !== expectedHash) {
        this.logger.warn('Webhook signature mismatch');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    const txRef: string | undefined =
      payload?.data?.tx_ref ?? payload?.tx_ref ?? payload?.data?.txRef;
    if (!txRef) return { ignored: true };

    const payment = await this.prisma.db.payment.findUnique({
      where: { reference: txRef },
    });
    if (!payment || payment.status === 'SUCCESS') {
      return { ignored: true };
    }
    await this.verifyPayment({ reference: txRef });
    return { processed: true, reference: txRef };
  }

  // ---- Application fees (pre-submission) ----

  /** Return the configured APPLICATION_FORM and ENTRANCE_EXAM fee structures. */
  async getApplicationFees(schoolId: string | null) {
    const fees = await this.prisma.db.feeStructure.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        type: { in: ['APPLICATION_FORM', 'ENTRANCE_EXAM'] },
      },
      orderBy: { type: 'asc' },
    });
    return fees.map((f) => ({
      id: f.id,
      type: f.type,
      name: f.name,
      amount: Number(f.amount),
    }));
  }

  // ---- Refunds ----
  async refund(dto: RefundDto, approvedBy: string) {
    const payment = await this.prisma.db.payment.findUnique({
      where: { id: dto.paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const refund = await this.prisma.db.refund.create({
      data: {
        paymentId: payment.id,
        amount: dto.amount ?? Number(payment.amount),
        reason: dto.reason,
        approvedBy,
      },
    });

    await this.prisma.db.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    });

    return refund;
  }

  // ---- Scholarships ----
  listScholarships(schoolId: string | null) {
    return this.prisma.db.scholarship.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  createScholarship(schoolId: string | null, dto: CreateScholarshipDto) {
    return this.prisma.db.scholarship.create({
      data: {
        schoolId: schoolId ?? '',
        studentId: dto.studentId,
        name: dto.name,
        percentage: dto.percentage,
        amount: dto.amount,
        reason: dto.reason,
      },
    });
  }

  // ---- Ledger ----
  ledgerForStudent(studentId: string) {
    return this.prisma.db.ledgerEntry.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ---- Student fee breakdown (admin) ----
  async studentFeeBreakdown(studentId: string) {
    const student = await this.prisma.db.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    // Get current session
    const currentSession = await this.prisma.db.academicSession.findFirst({
      where: { schoolId: student.schoolId, isCurrent: true },
    });

    // Determine current semester from latest course registration
    const latestReg = await this.prisma.db.courseRegistration.findFirst({
      where: { studentId: student.id, sessionId: currentSession?.id },
      orderBy: { createdAt: 'desc' },
    });
    const currentSemester = latestReg?.semester ?? 'FIRST';

    const [structures, payments] = await Promise.all([
      this.prisma.db.feeStructure.findMany({
        where: {
          schoolId: student.schoolId,
          AND: [
            { OR: [{ departmentId: null }, { departmentId: student.departmentId }] },
            { OR: [{ level: null }, { level: student.currentLevel }] },
            { OR: [{ sessionId: null }, { sessionId: currentSession?.id }] },
            { OR: [{ semester: null }, { semester: currentSemester }] } as any,
          ],
        } as any,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.db.payment.findMany({
        where: { studentId: student.id, status: 'SUCCESS' },
        include: { receipt: true, feeStructure: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Filter out optional fees that student hasn't paid for
    const paidFeeStructureIds = new Set(
      payments.filter((p) => p.feeStructureId).map((p) => p.feeStructureId!),
    );

    const applicableFees = structures.filter((f) => {
      if (f.isMandatory) return true;
      return paidFeeStructureIds.has(f.id);
    });

    // Define display order
    const typeOrder: Record<string, number> = {
      PORTAL_ACCESS: 0,
      SCHOOL: 1,
      LIBRARY: 2,
      MEDICAL: 3,
      SPORTS_WEAR: 4,
      MATRICULATION: 5,
      HOSTEL: 6,
      GRADUATION: 7,
      ACCEPTANCE: 8,
      OTHER: 9,
    };

    const sorted = [...applicableFees].sort((a, b) => {
      const oa = typeOrder[a.type] ?? 9;
      const ob = typeOrder[b.type] ?? 9;
      if (oa !== ob) return oa - ob;
      if (a.programmeId && !b.programmeId) return 1;
      if (!a.programmeId && b.programmeId) return -1;
      return a.name.localeCompare(b.name);
    });

    // Track which payments have been matched so we don't double-count
    const matchedPaymentIds = new Set<string>();

    const items = sorted.map((f) => {
      let paid = payments.find(
        (p) => p.feeStructureId === f.id && !matchedPaymentIds.has(p.id),
      );
      if (!paid) {
        paid = payments.find(
          (p) =>
            !p.feeStructureId &&
            !matchedPaymentIds.has(p.id) &&
            p.feeStructure?.type === f.type &&
            Number(p.amount) === Number(f.amount),
        );
      }
      if (paid) matchedPaymentIds.add(paid.id);
      return {
        id: f.id,
        description: f.name,
        type: f.type,
        amount: Number(f.amount),
        status: paid ? ('PAID' as const) : ('PENDING' as const),
        ref: paid?.reference ?? null,
        paidAt: paid?.paidAt ?? null,
        isOptional: !f.isMandatory,
      };
    });

    const total = items.reduce((sum, i) => sum + i.amount, 0);
    const paidTotal = items.filter((i) => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);

    return { items, summary: { total, paid: paidTotal, outstanding: total - paidTotal } };
  }

  // ---- Dashboard summary ----
  async dashboardSummary(schoolId: string | null) {
    const where = schoolId ? { schoolId } : {};
    const [
      totalCollected,
      pendingCount,
      pendingAmount,
      totalCount,
      refundedCount,
      refundedAmount,
    ] = await Promise.all([
      this.prisma.db.payment.aggregate({
        where: { ...where, status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.db.payment.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.db.payment.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { amount: true },
      }),
      this.prisma.db.payment.count({ where }),
      this.prisma.db.payment.count({ where: { ...where, status: 'REFUNDED' } }),
      this.prisma.db.payment.aggregate({
        where: { ...where, status: 'REFUNDED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalCollected: Number(totalCollected._sum.amount ?? 0),
      pendingCount,
      pendingAmount: Number(pendingAmount._sum.amount ?? 0),
      totalCount,
      refundedCount,
      refundedAmount: Number(refundedAmount._sum.amount ?? 0),
    };
  }
}
