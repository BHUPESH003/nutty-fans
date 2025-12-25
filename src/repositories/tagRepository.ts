import { prisma } from '@/lib/db/prisma';

export interface TagRecord {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  isNsfw: boolean;
  isBanned: boolean;
  isPending: boolean;
}

export class TagRepository {
  async search(query: string, limit = 20): Promise<TagRecord[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return prisma.tag.findMany({
      where: {
        isBanned: false,
        OR: [
          { slug: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ usageCount: 'desc' }, { slug: 'asc' }],
      take: Math.min(Math.max(limit, 1), 50),
      select: {
        id: true,
        name: true,
        slug: true,
        usageCount: true,
        isNsfw: true,
        isBanned: true,
        isPending: true,
      },
    });
  }

  async trending(limit = 20): Promise<TagRecord[]> {
    return prisma.tag.findMany({
      where: { isBanned: false, isPending: false },
      orderBy: [{ usageCount: 'desc' }, { slug: 'asc' }],
      take: Math.min(Math.max(limit, 1), 50),
      select: {
        id: true,
        name: true,
        slug: true,
        usageCount: true,
        isNsfw: true,
        isBanned: true,
        isPending: true,
      },
    });
  }

  async upsertMany(tags: Array<{ slug: string; name: string }>) {
    const unique = new Map<string, { slug: string; name: string }>();
    for (const t of tags) {
      if (!t.slug) continue;
      unique.set(t.slug, t);
    }

    const items = Array.from(unique.values());
    if (items.length === 0) return [];

    // Prisma doesn't support upsertMany, so we do:
    // 1) createMany with skipDuplicates
    // 2) read back by slugs
    await prisma.tag.createMany({
      data: items.map((t) => ({
        slug: t.slug,
        name: t.name,
        isPending: false,
        isBanned: false,
      })),
      skipDuplicates: true,
    });

    return prisma.tag.findMany({
      where: { slug: { in: items.map((t) => t.slug) } },
      select: { id: true, slug: true, name: true },
    });
  }

  async getPostTagIds(postId: string): Promise<string[]> {
    const rows = await prisma.postTag.findMany({
      where: { postId },
      select: { tagId: true },
    });
    return rows.map((r) => r.tagId);
  }

  async setTagsForPost(postId: string, tagIds: string[]) {
    const uniqueTagIds = Array.from(new Set(tagIds));

    return prisma.$transaction(async (tx) => {
      const existingTagIds = await tx.postTag.findMany({
        where: { postId },
        select: { tagId: true },
      });
      const existingSet = new Set(existingTagIds.map((r) => r.tagId));
      const nextSet = new Set(uniqueTagIds);

      const toAdd = uniqueTagIds.filter((id) => !existingSet.has(id));
      const toRemove = Array.from(existingSet).filter((id) => !nextSet.has(id));

      // Replace join rows
      await tx.postTag.deleteMany({ where: { postId } });
      if (uniqueTagIds.length > 0) {
        await tx.postTag.createMany({
          data: uniqueTagIds.map((tagId) => ({ postId, tagId })),
          skipDuplicates: true,
        });
      }

      // Update usage counts
      if (toAdd.length > 0) {
        await tx.tag.updateMany({
          where: { id: { in: toAdd } },
          data: { usageCount: { increment: 1 } },
        });
      }

      if (toRemove.length > 0) {
        await tx.tag.updateMany({
          where: { id: { in: toRemove }, usageCount: { gt: 0 } },
          data: { usageCount: { decrement: 1 } },
        });
      }
    });
  }
}
