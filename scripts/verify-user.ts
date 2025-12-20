import { prisma } from '../src/lib/db/prisma';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Please provide an email address.');
    process.exit(1);
  }

  try {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });
    // console.log(`User ${email} verified successfully.`);
  } catch (error) {
    console.error('Error verifying user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
