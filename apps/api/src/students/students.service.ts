import { Injectable, NotFoundException } from '@nestjs/common';
import type { Paginated } from '@goinze/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { paginated } from '../common/utils/pagination.util';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  CreateStudentDto,
  UpdateStudentDto,
  ImportStudentsDto,
} from './dto/student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    schoolId: string | null,
    query: PaginationDto,
    status?: string,
    departmentId?: string,
  ): Promise<Paginated<any>> {
    const where: Record<string, any> = {};
    if (schoolId) where.schoolId = schoolId;
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { matricNumber: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return paginated(this.prisma.db.student, {
      where,
      page: query.page,
      pageSize: query.pageSize,
      include: { programme: true, department: true },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.db.student.findUnique({
      where: { id },
      include: {
        programme: true,
        department: true,
        user: true,
        payments: true,
        results: true,
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async create(schoolId: string | null, dto: CreateStudentDto) {
    return this.prisma.db.student.create({
      data: {
        schoolId: schoolId ?? '',
        firstName: dto.firstName,
        lastName: dto.lastName,
        middleName: dto.middleName,
        gender: dto.gender as any,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        stateOfOrigin: dto.stateOfOrigin,
        nationality: dto.nationality,
        matricNumber: dto.matricNumber,
        regNumber: dto.regNumber,
        programmeId: dto.programmeId,
        departmentId: dto.departmentId,
        currentLevel: dto.currentLevel,
        status: (dto.status as any) ?? 'APPLICANT',
      },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    return this.prisma.db.student.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        middleName: dto.middleName,
        gender: dto.gender as any,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        stateOfOrigin: dto.stateOfOrigin,
        programmeId: dto.programmeId,
        departmentId: dto.departmentId,
        currentLevel: dto.currentLevel,
        status: dto.status as any,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.db.student.delete({ where: { id } });
  }

  /** Bulk import stub — creates many students in a transaction. */
  async import(schoolId: string | null, dto: ImportStudentsDto) {
    const records = Array.isArray(dto.records) ? dto.records : [];
    const created = await this.prisma.db.$transaction(
      records.map((r) =>
        this.prisma.db.student.create({
          data: {
            schoolId: schoolId ?? '',
            firstName: r.firstName,
            lastName: r.lastName,
            middleName: r.middleName,
            gender: r.gender as any,
            email: r.email,
            phone: r.phone,
            matricNumber: r.matricNumber,
            regNumber: r.regNumber,
            programmeId: r.programmeId,
            departmentId: r.departmentId,
            currentLevel: r.currentLevel,
            status: (r.status as any) ?? 'ACTIVE',
          },
        }),
      ),
    );
    return { imported: created.length };
  }

  /** Transition a student's lifecycle status. */
  private async setStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.db.student.update({
      where: { id },
      data: { status: status as any },
    });
  }

  suspend(id: string) {
    return this.setStatus(id, 'SUSPENDED');
  }

  graduate(id: string) {
    return this.setStatus(id, 'GRADUATED');
  }

  archive(id: string) {
    return this.setStatus(id, 'ARCHIVED');
  }
}
