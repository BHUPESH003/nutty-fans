import { prisma } from '@/lib/db/prisma';

export class CategoryRepository {
  async listActive() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
    });
  }
}
