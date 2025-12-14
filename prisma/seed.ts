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
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

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
// MAIN
// ============================================================================

async function main() {
  // eslint-disable-next-line no-console
  console.log('\n🌱 Starting database seed...\n');

  try {
    await seedAdminRoles();
    await seedCategories();

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
