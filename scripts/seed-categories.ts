import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/db/prisma';

const CATEGORIES = [
  { name: 'Music', slug: 'music', icon: 'music' },
  { name: 'Fitness', slug: 'fitness', icon: 'dumbbell' },
  { name: 'Gaming', slug: 'gaming', icon: 'gamepad-2' },
  { name: 'Art', slug: 'art', icon: 'palette' },
  { name: 'Lifestyle', slug: 'lifestyle', icon: 'camera' },
];

async function main() {
  console.warn('Seeding categories...');

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        isActive: true,
      },
    });
  }

  console.warn('Categories seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
