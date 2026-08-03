import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// NOTE: `export * from '@prisma/client'` is intentionally avoided — when Node
// loads this .ts entry natively (require(esm) + type stripping), star
// re-exporting the CJS Prisma package propagates its `module.exports` marker
// and silently drops the local `prisma` export. Re-export explicitly instead.
export { PrismaClient, Prisma, $Enums } from '@prisma/client';
export type * from '@prisma/client';
export default prisma;
