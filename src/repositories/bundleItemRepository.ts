import { prisma } from '@/lib/db/prisma';

export class BundleItemRepository {
  async replaceItems(bundleId: string, postIds: string[]) {
    const uniquePostIds = Array.from(new Set(postIds));

    return prisma.$transaction(async (tx) => {
      await tx.bundleItem.deleteMany({ where: { bundleId } });
      if (uniquePostIds.length > 0) {
        await tx.bundleItem.createMany({
          data: uniquePostIds.map((postId, idx) => ({
            bundleId,
            postId,
            sortOrder: idx,
          })),
          skipDuplicates: true,
        });
      }
      const count = await tx.bundleItem.count({ where: { bundleId } });
      return count;
    });
  }

  async listPostIds(bundleId: string) {
    const items = await prisma.bundleItem.findMany({
      where: { bundleId },
      orderBy: { sortOrder: 'asc' },
      select: { postId: true },
    });
    return items.map((i) => i.postId);
  }
}
