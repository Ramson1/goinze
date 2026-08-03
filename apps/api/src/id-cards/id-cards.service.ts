import { Injectable, NotFoundException } from '@nestjs/common';
import {
  generateCardNumber,
  generateVerificationCode,
} from '@goinze/shared-utils';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Digital ID cards: generate for a student or staff member, verify by code,
 * and revoke.
 */
@Injectable()
export class IdCardsService {
  constructor(private readonly prisma: PrismaService) {}

  private async schoolCode(schoolId: string | null): Promise<string> {
    if (!schoolId) return 'GIS';
    const school = await this.prisma.db.school.findUnique({
      where: { id: schoolId },
      select: { code: true },
    });
    return school?.code ?? 'GIS';
  }

  /** Generate an ID card for a student or staff member. */
  async generate(
    schoolId: string | null,
    data: { type: 'STUDENT' | 'STAFF'; studentId?: string; staffId?: string },
  ) {
    const code = await this.schoolCode(schoolId);
    const cardNumber = generateCardNumber(code);
    const verificationCode = generateVerificationCode();

    return this.prisma.db.idCard.create({
      data: {
        schoolId: schoolId ?? '',
        type: data.type as any,
        studentId: data.studentId,
        staffId: data.staffId,
        cardNumber,
        verificationCode,
        qrData: `goinzeschool://id/${verificationCode}`,
        barcode: cardNumber,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  list(schoolId: string | null, type?: string) {
    const where: Record<string, any> = {};
    if (schoolId) where.schoolId = schoolId;
    if (type) where.type = type;
    return this.prisma.db.idCard.findMany({
      where,
      include: { student: true, staff: true },
      orderBy: { issuedAt: 'desc' },
      take: 200,
    });
  }

  /** Verify an ID card by its verification code. */
  async verify(code: string) {
    const card = await this.prisma.db.idCard.findUnique({
      where: { verificationCode: code.toUpperCase() },
      include: { student: true, staff: true },
    });
    if (!card) throw new NotFoundException('ID card not found or invalid code');
    return {
      valid: card.status === 'ACTIVE',
      status: card.status,
      card,
    };
  }

  /** Revoke an ID card. */
  async revoke(id: string) {
    const card = await this.prisma.db.idCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('ID card not found');
    return this.prisma.db.idCard.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }
}
