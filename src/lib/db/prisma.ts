/**
 * Prisma Client Singleton (Prisma 7.x)
 *
 * This file provides the single source of truth for all database access.
 * Per CODEBASE_ARCHITECTURE_RULES §6.1, all database access must go through this client.
 *
 * Usage:
 * - Import `prisma` from this file in Repository layer only
 * - Never import PrismaClient directly elsewhere
 * - Never create new PrismaClient instances
 *
 * @example
 * // In a repository file
 * import { prisma } from '@/lib/db/prisma';
 *
 * export async function findUserById(id: string) {
 *   return prisma.user.findUnique({ where: { id } });
 * }
 */

// Prisma 7.x: Import from the generated output location specified in schema.prisma
// Prisma 7.x: PostgreSQL adapter for database connections
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

/**
 * Create PostgreSQL connection pool.
 * Pool is reused across hot reloads in development.
 */
function createPool(): Pool {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return new Pool({ connectionString });
}

/**
 * Create Prisma Client with PostgreSQL adapter.
 * Prisma 7.x requires a driver adapter for database connections.
 */
function createPrismaClient(pool: Pool): PrismaClient {
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    // Logging configuration
    log: process.env['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
  });
}

/**
 * PostgreSQL connection pool.
 * Shared across Prisma Client instances.
 */
const pool = globalForPrisma.pool ?? createPool();

/**
 * Prisma Client instance.
 *
 * In development, we store the client on `globalThis` to prevent
 * multiple instances due to hot reloading.
 *
 * In production, we create a new client for each cold start.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient(pool);

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

/**
 * Graceful shutdown helper.
 * Call this when the application is shutting down.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}
