import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Paginated } from '@goinze/shared-types';
import { generatePaymentRef } from '@goinze/shared-utils';
import { PrismaService } from '../prisma/prisma.service';
import { paginated } from '../common/utils/pagination.util';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FlutterwaveGateway } from './flutterwave.gateway';
import {
  CreateFeeStructureDto,
  InitPaymentDto,
  VerifyPaymentDto,
  RefundDto,
  CreateScholarshipDto,
} from './dto/finance.dto';

@Injectable()
export class FinanceService {
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
        programmeId: dto.programmeId,
        isMandatory: dto.isMandatory ?? true,
        allowInstallment: dto.allowInstallment ?? false,
      },
    });
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
    return paginated(this.prisma.db.payment, {
      where,
      page: query.page,
      pageSize: query.pageSize,
      include: { student: true, feeStructure: true, receipt: true },
    });
  }

  /** Initialize a payment and return a Flutterwave checkout URL. */
  async initPayment(schoolId: string | null, dto: InitPaymentDto) {
    const reference = generatePaymentRef();

    // Resolve a customer email + owning school from the application or student
    // so unauthenticated applicants can pay the acceptance fee.
    let customerEmail = dto.customerEmail;
    let resolvedSchoolId = schoolId;
    if (dto.applicationId) {
      const app = await this.prisma.db.application.findUnique({
        where: { id: dto.applicationId },
      });
      customerEmail = customerEmail ?? app?.email;
      resolvedSchoolId = resolvedSchoolId ?? app?.schoolId ?? null;
    }
    if (!customerEmail && dto.studentId) {
      const student = await this.prisma.db.student.findUnique({
        where: { id: dto.studentId },
      });
      customerEmail = student?.email ?? undefined;
      resolvedSchoolId = resolvedSchoolId ?? student?.schoolId ?? null;
    }
    if (!resolvedSchoolId) {
      throw new BadRequestException(
        'Unable to resolve a school for this payment. Provide an applicationId or studentId.',
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
      },
    });

    const redirectUrl =
      dto.redirectUrl ??
      this.config.get<string>('WEB_APP_URL', 'http://localhost:3000');

    const { checkoutUrl, live } = await this.gateway.initialize({
      txRef: reference,
      amount: Number(dto.amount),
      currency: dto.currency ?? 'NGN',
      email: customerEmail ?? 'applicant@goinzeschool.com',
      redirectUrl: `${redirectUrl}/payment/callback`,
      title: 'Goinzeschool Payment',
      description: `Payment ${reference}`,
    });

    return { payment, reference, checkoutUrl, live };
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
    if (payment.status === 'SUCCESS') return payment;

    const result = await this.gateway.verify(dto.reference);
    if (result.status !== 'successful') {
      throw new BadRequestException(
        `Payment not successful (gateway status: ${result.status}).`,
      );
    }

    const updated = await this.prisma.db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        gatewayRef: result.flwRef || dto.gatewayRef,
        paidAt: new Date(),
      },
    });

    // Credit the student ledger when applicable.
    if (payment.studentId) {
      await this.prisma.db.ledgerEntry.create({
        data: {
          studentId: payment.studentId,
          paymentId: payment.id,
          credit: Number(payment.amount),
          balance: Number(payment.amount),
          narration: `Payment ${payment.reference}`,
        },
      });
    }

    // Acceptance-fee flow: mark paid and auto-admit if already approved.
    if (payment.applicationId) {
      await this.onAcceptanceFeePaid(payment.applicationId);
    }

    return updated;
  }

  /**
   * Handle a successful acceptance-fee payment for an application:
   * flag it paid, then finalize admission if the application is approved.
   */
  private async onAcceptanceFeePaid(applicationId: string) {
    const application = await this.prisma.db.application.update({
      where: { id: applicationId },
      data: { acceptanceFeePaid: true },
    });

    if (application.status === 'APPROVED' && application.studentId) {
      await this.prisma.db.$transaction([
        this.prisma.db.student.update({
          where: { id: application.studentId },
          data: { status: 'ACTIVE' },
        }),
        this.prisma.db.application.update({
          where: { id: applicationId },
          data: { status: 'ADMITTED' },
        }),
      ]);
    }
  }

  /** Process a Flutterwave webhook event (charge.completed). */
  async handleWebhook(payload: any) {
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
