import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/db/prisma';
import { hashPassword } from '../src/lib/security/hash';

async function main() {
  const email = 'qa_clean_1704087000@example.com';
  const password = 'Password123!';
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: 'QA User',
      username: 'qa_clean',
      dateOfBirth: new Date('2000-01-01'),
      country: 'US',
      metadata: {
        authState: {
          accountState: 'email_unverified',
        },
      },
    },
  });

  console.warn('Created user:', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
