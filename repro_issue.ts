/* eslint-disable */
import 'dotenv/config';
import { prisma } from './src/lib/db/prisma';

async function main() {
  console.log('Testing prisma.account.findUnique...');
  try {
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: 'test_id_123',
        },
      },
    });
    console.log('Success:', account);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
