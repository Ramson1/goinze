import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma } from '@goinze/database';
import type { PrismaClient } from '@goinze/database';

/**
 * Thin wrapper around the shared Prisma client exported by @goinze/database.
 * The underlying client is a module-level singleton, so every service that
 * injects PrismaService shares the exact same connection pool.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  /** The shared PrismaClient singleton. */
  get client(): PrismaClient {
    return prisma;
  }

  /** Convenience alias so `this.prisma.db.student.findMany(...)` reads well. */
  get db(): PrismaClient {
    return prisma;
  }

  async onModuleInit(): Promise<void> {
    await prisma.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await prisma.$disconnect();
  }
}
