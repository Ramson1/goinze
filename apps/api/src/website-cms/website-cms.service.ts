import { Injectable, NotFoundException } from '@nestjs/common';
import { slugify } from '@goinze/shared-utils';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/utils/cloudinary.service';

/**
 * Website CMS: website content blocks, news posts, events and gallery.
 * Public read endpoints are exposed via @Public() in the controller.
 */
@Injectable()
export class WebsiteCmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ---- Website content ----
  listContent(schoolId: string | null) {
    return this.prisma.db.websiteContent.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { key: 'asc' },
    });
  }

  upsertContent(
    schoolId: string | null,
    data: { key: string; title?: string; body?: any },
  ) {
    return this.prisma.db.websiteContent.upsert({
      where: { schoolId_key: { schoolId: schoolId ?? '', key: data.key } },
      create: { schoolId: schoolId ?? '', key: data.key, title: data.title, body: data.body },
      update: { title: data.title, body: data.body },
    });
  }

  // ---- News posts ----
  listNews(schoolId: string | null, publishedOnly = false) {
    const where: Record<string, any> = {};
    if (schoolId) where.schoolId = schoolId;
    if (publishedOnly) where.published = true;
    return this.prisma.db.newsPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getNewsBySlug(schoolId: string | null, slug: string) {
    const post = await this.prisma.db.newsPost.findFirst({
      where: { slug, ...(schoolId ? { schoolId } : {}) },
    });
    if (!post) throw new NotFoundException('News post not found');
    return post;
  }

  createNews(
    schoolId: string | null,
    data: {
      title: string;
      body: string;
      category?: string;
      excerpt?: string;
      coverUrl?: string;
      published?: boolean;
    },
  ) {
    return this.prisma.db.newsPost.create({
      data: {
        schoolId: schoolId ?? '',
        title: data.title,
        slug: slugify(data.title),
        body: data.body,
        category: data.category,
        excerpt: data.excerpt,
        coverUrl: data.coverUrl,
        published: data.published ?? false,
        publishedAt: data.published ? new Date() : undefined,
      },
    });
  }

  async setNewsPublished(id: string, published: boolean) {
    const post = await this.prisma.db.newsPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('News post not found');
    return this.prisma.db.newsPost.update({
      where: { id },
      data: {
        published,
        publishedAt: published ? new Date() : null,
      },
    });
  }

  // ---- Events ----
  listEvents(schoolId: string | null) {
    return this.prisma.db.event.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { startsAt: 'asc' },
      take: 100,
    });
  }

  createEvent(
    schoolId: string | null,
    data: {
      title: string;
      description?: string;
      location?: string;
      startsAt: string;
      endsAt?: string;
      coverUrl?: string;
    },
  ) {
    return this.prisma.db.event.create({
      data: {
        schoolId: schoolId ?? '',
        title: data.title,
        description: data.description,
        location: data.location,
        startsAt: new Date(data.startsAt),
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
        coverUrl: data.coverUrl,
      },
    });
  }

  // ---- Gallery ----
  listGallery(schoolId: string | null, album?: string) {
    const where: Record<string, any> = {};
    if (schoolId) where.schoolId = schoolId;
    if (album) where.album = album;
    return this.prisma.db.galleryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  createGalleryItem(
    schoolId: string | null,
    data: { url: string; type?: string; caption?: string; album?: string },
  ) {
    return this.prisma.db.galleryItem.create({
      data: {
        schoolId: schoolId ?? '',
        url: data.url,
        type: (data.type as any) ?? 'IMAGE',
        caption: data.caption,
        album: data.album,
      },
    });
  }

  // ---- File uploads ----

  /** Upload a file to Cloudinary and return the hosted URL. */
  async uploadMedia(file: Buffer, folder = 'goinzeschool/cms') {
    return this.cloudinary.uploadImage(file, folder);
  }
}
