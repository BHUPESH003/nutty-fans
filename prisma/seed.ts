/**
 * Prisma Seed Script
 *
 * Seeds the database with initial required data:
 * - Admin roles (super_admin, moderator, support)
 * - Admin permissions for each role
 * - Default categories
 *
 * Run with: pnpm db:seed
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Create connection pool with Neon-compatible SSL settings
const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1, // Limit connections for serverless
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============================================================================
// ADMIN ROLES & PERMISSIONS
// ============================================================================

const adminRoles = [
  {
    name: 'super_admin',
    description: 'Full platform access - can manage all aspects of the platform',
  },
  {
    name: 'moderator',
    description: 'Content and user moderation - can review reports and moderate content',
  },
  {
    name: 'support',
    description: 'Customer support access - can view user data and handle support tickets',
  },
] as const;

// Permission definitions by role
const rolePermissions: Record<string, string[]> = {
  super_admin: [
    'manage_users',
    'manage_creators',
    'moderate_content',
    'review_reports',
    'resolve_reports',
    'manage_payouts',
    'view_analytics',
    'manage_categories',
    'manage_dmca',
    'ban_users',
    'suspend_users',
    'view_transactions',
    'issue_refunds',
    'manage_admins',
  ],
  moderator: [
    'moderate_content',
    'review_reports',
    'resolve_reports',
    'suspend_users',
    'manage_dmca',
    'view_transactions',
  ],
  support: ['manage_users', 'view_transactions', 'review_reports'],
};

// ============================================================================
// DEFAULT CATEGORIES
// ============================================================================

const defaultCategories = [
  { name: 'Fitness', slug: 'fitness', icon: '💪', isNsfw: false, sortOrder: 1 },
  { name: 'Music', slug: 'music', icon: '🎵', isNsfw: false, sortOrder: 2 },
  { name: 'Art', slug: 'art', icon: '🎨', isNsfw: false, sortOrder: 3 },
  { name: 'Gaming', slug: 'gaming', icon: '🎮', isNsfw: false, sortOrder: 4 },
  { name: 'Cooking', slug: 'cooking', icon: '👨‍🍳', isNsfw: false, sortOrder: 5 },
  { name: 'Education', slug: 'education', icon: '📚', isNsfw: false, sortOrder: 6 },
  { name: 'Fashion', slug: 'fashion', icon: '👗', isNsfw: false, sortOrder: 7 },
  { name: 'Photography', slug: 'photography', icon: '📷', isNsfw: false, sortOrder: 8 },
  { name: 'Travel', slug: 'travel', icon: '✈️', isNsfw: false, sortOrder: 9 },
  { name: 'Comedy', slug: 'comedy', icon: '😂', isNsfw: false, sortOrder: 10 },
  { name: 'Lifestyle', slug: 'lifestyle', icon: '🌟', isNsfw: false, sortOrder: 11 },
  { name: 'Adult', slug: 'adult', icon: '🔞', isNsfw: true, sortOrder: 100 },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedAdminRoles() {
  // eslint-disable-next-line no-console
  console.log('🔐 Seeding admin roles...');

  for (const role of adminRoles) {
    const existingRole = await prisma.adminRole.findUnique({
      where: { name: role.name },
    });

    if (existingRole) {
      // eslint-disable-next-line no-console
      console.log(`  ⏭️  Role "${role.name}" already exists, skipping...`);
      continue;
    }

    const createdRole = await prisma.adminRole.create({
      data: {
        name: role.name,
        description: role.description,
        isActive: true,
      },
    });

    // eslint-disable-next-line no-console
    console.log(`  ✅ Created role: ${role.name}`);

    // Add permissions for this role
    const permissions = rolePermissions[role.name] || [];
    for (const permission of permissions) {
      await prisma.adminPermission.create({
        data: {
          roleId: createdRole.id,
          permission,
        },
      });
    }
    // eslint-disable-next-line no-console
    console.log(`     📋 Added ${permissions.length} permissions`);
  }

  // eslint-disable-next-line no-console
  console.log('✅ Admin roles seeded successfully!\n');
}

async function seedCategories() {
  // eslint-disable-next-line no-console
  console.log('📁 Seeding categories...');

  for (const category of defaultCategories) {
    const existingCategory = await prisma.category.findUnique({
      where: { slug: category.slug },
    });

    if (existingCategory) {
      // eslint-disable-next-line no-console
      console.log(`  ⏭️  Category "${category.name}" already exists, skipping...`);
      continue;
    }

    await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        isNsfw: category.isNsfw,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });

    // eslint-disable-next-line no-console
    console.log(`  ✅ Created category: ${category.name} ${category.icon}`);
  }

  // eslint-disable-next-line no-console
  console.log('✅ Categories seeded successfully!\n');
}

// ============================================================================
// DEV USERS (CREATORS + FANS)
// ============================================================================

type SeedUserSpec = {
  email: string;
  username: string;
  displayName: string;
  password: string;
  role: 'user' | 'creator';
};

const seedCreators: SeedUserSpec[] = [
  {
    email: 'creator1@seed.local',
    username: 'creator1',
    displayName: 'Creator One',
    password: 'SeedPass!234',
    role: 'creator',
  },
  {
    email: 'creator2@seed.local',
    username: 'creator2',
    displayName: 'Creator Two',
    password: 'SeedPass!234',
    role: 'creator',
  },
  {
    email: 'creator3@seed.local',
    username: 'creator3',
    displayName: 'Creator Three',
    password: 'SeedPass!234',
    role: 'creator',
  },
];

const seedUsers: SeedUserSpec[] = [
  {
    email: 'user1@seed.local',
    username: 'user1',
    displayName: 'User One',
    password: 'SeedPass!234',
    role: 'user',
  },
  {
    email: 'user2@seed.local',
    username: 'user2',
    displayName: 'User Two',
    password: 'SeedPass!234',
    role: 'user',
  },
  {
    email: 'user3@seed.local',
    username: 'user3',
    displayName: 'User Three',
    password: 'SeedPass!234',
    role: 'user',
  },
  {
    email: 'user4@seed.local',
    username: 'user4',
    displayName: 'User Four',
    password: 'SeedPass!234',
    role: 'user',
  },
  {
    email: 'user5@seed.local',
    username: 'user5',
    displayName: 'User Five',
    password: 'SeedPass!234',
    role: 'user',
  },
];

async function seedDevAccounts() {
  // eslint-disable-next-line no-console
  console.log('👤 Seeding dev users + creators...');

  const now = new Date();

  const defaultCategory = await prisma.category.findUnique({ where: { slug: 'fitness' } });
  if (!defaultCategory) {
    throw new Error('Default category "fitness" not found; seedCategories must run first');
  }

  const all = [...seedCreators, ...seedUsers];

  for (const spec of all) {
    const email = spec.email.toLowerCase();
    const passwordHash = await bcrypt.hash(spec.password, 12);

    const existing = await prisma.user.findUnique({
      where: { email },
      include: { creatorProfile: true },
    });

    if (!existing) {
      const created = await prisma.user.create({
        data: {
          email,
          username: spec.username,
          displayName: spec.displayName,
          passwordHash,
          role: spec.role,
          status: 'active',
          emailVerified: now,
          walletBalance: new Prisma.Decimal(1000),
          metadata: {
            authState: {
              accountState: 'active',
              failedLoginAttempts: 0,
              lockUntil: null,
            },
          },
        },
      });

      if (spec.role === 'creator') {
        await prisma.creatorProfile.create({
          data: {
            userId: created.id,
            categoryId: defaultCategory.id,
            subscriptionPrice: new Prisma.Decimal(9.99),
            tipsEnabled: true,
            onboardingStatus: 'active',
            isVerified: true,
            kycStatus: 'approved',
          },
        });
      }

      // eslint-disable-next-line no-console
      console.log(`  ✅ Created ${spec.role}: ${spec.email}`);
      continue;
    }

    // Keep seed idempotent: ensure verification + balance exist, and creator profile exists for creators.
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        username: existing.username ?? spec.username,
        displayName: existing.displayName ?? spec.displayName,
        passwordHash: existing.passwordHash ?? passwordHash,
        emailVerified: existing.emailVerified ?? now,
        role: spec.role,
        status: 'active',
        walletBalance: new Prisma.Decimal(1000),
        metadata: {
          ...(typeof existing.metadata === 'object' && existing.metadata !== null
            ? (existing.metadata as object)
            : {}),
          authState: {
            accountState: 'active',
            failedLoginAttempts: 0,
            lockUntil: null,
          },
        },
      },
    });

    if (spec.role === 'creator' && !existing.creatorProfile) {
      await prisma.creatorProfile.create({
        data: {
          userId: existing.id,
          categoryId: defaultCategory.id,
          subscriptionPrice: new Prisma.Decimal(9.99),
          tipsEnabled: true,
          onboardingStatus: 'active',
          isVerified: true,
          kycStatus: 'approved',
        },
      });
    }

    // eslint-disable-next-line no-console
    console.log(`  ⏭️  Updated ${spec.role}: ${spec.email}`);
  }

  // eslint-disable-next-line no-console
  console.log('✅ Dev accounts seeded successfully!\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  // eslint-disable-next-line no-console
  console.log('\n🌱 Starting database seed...\n');

  try {
    await seedAdminRoles();
    await seedCategories();
    await seedDevAccounts();

    // eslint-disable-next-line no-console
    console.log('🎉 Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
