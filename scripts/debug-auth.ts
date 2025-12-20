/* eslint-disable no-console */
import dotenv from 'dotenv';

import { prisma } from '../src/lib/db/prisma';

dotenv.config();

async function main() {
  console.log('--- Debugging Auth ---');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      accounts: true,
      sessions: true,
    },
  });

  console.log(`Found ${users.length} recent users:`);
  for (const user of users) {
    console.log(`User: ${user.email} (${user.id})`);
    console.log('  Accounts:', user.accounts.length);
    user.accounts.forEach((acc) => {
      console.log(`    - Provider: ${acc.provider}, ID: ${acc.providerAccountId}`);
    });
    console.log('  Sessions:', user.sessions.length);
    user.sessions.forEach((sess) => {
      console.log(`    - Expires: ${sess.expires}`);
    });
    console.log('---');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
