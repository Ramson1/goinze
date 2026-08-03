import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/utils/cloudinary.service';

/**
 * Documents: record upload metadata, list by student/owner and delete.
 * File storage is handled via Cloudinary through CloudinaryService.
 */
@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /** Upload a raw file buffer to Cloudinary and return the hosted URL. */
  async uploadFile(file: Buffer, folder = 'goinzeschool') {
    return this.cloudinary.uploadImage(file, folder);
  }

  /** Record metadata for an uploaded document. */
  create(
    schoolId: string | null,
    data: {
      name: string;
      url: string;
      type?: string;
      mimeType?: string;
      sizeBytes?: number;
      studentId?: string;
      applicationId?: string;
      ownerUserId?: string;
    },
  ) {
    return this.prisma.db.document.create({
      data: {
        schoolId: schoolId ?? '',
        name: data.name,
        url: data.url,
        type: (data.type as any) ?? 'OTHER',
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        studentId: data.studentId,
        applicationId: data.applicationId,
        ownerUserId: data.ownerUserId,
      },
    });
  }

  listByStudent(studentId: string) {
    return this.prisma.db.document.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  list(schoolId: string | null) {
    return this.prisma.db.document.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async remove(id: string) {
    const document = await this.prisma.db.document.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');
    return this.prisma.db.document.delete({ where: { id } });
  }
}
