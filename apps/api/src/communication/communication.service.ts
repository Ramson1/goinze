import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Communication: announcements, direct messages and notifications.
 */
@Injectable()
export class CommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Announcements ----
  listAnnouncements(schoolId: string | null) {
    return this.prisma.db.announcement.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      take: 100,
    });
  }

  createAnnouncement(
    schoolId: string | null,
    data: { title: string; body: string; audience?: string; pinned?: boolean },
  ) {
    return this.prisma.db.announcement.create({
      data: {
        schoolId: schoolId ?? '',
        title: data.title,
        body: data.body,
        audience: data.audience ?? 'ALL',
        pinned: data.pinned ?? false,
      },
    });
  }

  // ---- Messages ----
  listMessages(userId: string) {
    return this.prisma.db.message.findMany({
      where: { recipientId: userId },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  sendMessage(data: {
    senderId: string;
    recipientId?: string;
    subject?: string;
    body: string;
  }) {
    return this.prisma.db.message.create({
      data: {
        senderId: data.senderId,
        recipientId: data.recipientId,
        subject: data.subject,
        body: data.body,
      },
    });
  }

  async markMessageRead(id: string) {
    const message = await this.prisma.db.message.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Message not found');
    return this.prisma.db.message.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  // ---- Notifications ----
  listNotifications(userId: string) {
    return this.prisma.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  createNotification(data: {
    schoolId?: string | null;
    userId?: string;
    title: string;
    body: string;
    channel?: string;
  }) {
    return this.prisma.db.notification.create({
      data: {
        schoolId: data.schoolId ?? undefined,
        userId: data.userId,
        title: data.title,
        body: data.body,
        channel: (data.channel as any) ?? 'IN_APP',
        status: 'QUEUED',
      },
    });
  }

  async markNotificationRead(id: string) {
    const notification = await this.prisma.db.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    return this.prisma.db.notification.update({
      where: { id },
      data: { status: 'READ' },
    });
  }
}
