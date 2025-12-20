import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/db/prisma';

async function main() {
  const email = 'qa_clean_1704087000@example.com';

  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: new Date(),
      metadata: {
        authState: {
          accountState: 'active',
        },
      },
    },
  });

  console.warn('User verified successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
