/**
 * Prisma Configuration (Prisma 7.x)
 *
 * This file configures Prisma CLI and migrations.
 * See: https://pris.ly/d/prisma7-config
 *
 * For the PrismaClient runtime configuration, see:
 * - src/lib/db/prisma.ts
 */

// prisma.config.ts

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --import tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
