import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/db/prisma';

async function main() {
  const email = 'qa_clean_1704087000@example.com';
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error('User not found');
    return;
  }

  console.warn('Creating post for user:', user.id);

  const post = await prisma.post.create({
    data: {
      creatorId: user.id,
      content: 'Test post from script',
      postType: 'post',
      accessLevel: 'free',
      status: 'published',
      publishedAt: new Date(),
    },
  });

  console.warn('Post created:', post);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
