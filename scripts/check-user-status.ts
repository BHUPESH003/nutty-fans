import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/db/prisma';

async function main() {
  const users = await prisma.user.findMany();
  console.warn('Total users:', users.length);
  users.forEach((u) => {
    console.warn(`- ${u.email} (Verified: ${u.emailVerified})`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
