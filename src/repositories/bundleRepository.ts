import { prisma } from '@/lib/db/prisma';

export class BundleRepository {
  async create(data: {
    creatorId: string;
    title: string;
    description?: string | null;
    price: number;
    originalPrice?: number | null;
    coverImageUrl?: string | null;
  }) {
    return prisma.bundle.create({
      data: {
        creatorId: data.creatorId,
        title: data.title,
        description: data.description ?? null,
        price: data.price,
        originalPrice: data.originalPrice ?? null,
        coverImageUrl: data.coverImageUrl ?? null,
        status: 'draft',
      },
      include: {
        items: { include: { post: { select: { id: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      price?: number;
      originalPrice?: number | null;
      coverImageUrl?: string | null;
      status?: 'draft' | 'active' | 'archived';
    }
  ) {
    return prisma.bundle.update({
      where: { id },
      data,
      include: {
        items: { include: { post: { select: { id: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findById(id: string) {
    return prisma.bundle.findUnique({
      where: { id },
      include: {
        creator: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
        items: {
          include: {
            post: {
              select: {
                id: true,
                content: true,
                media: { take: 1, select: { thumbnailUrl: true } },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async listByCreator(creatorId: string, cursor?: string, limit = 20) {
    return prisma.bundle.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        items: { include: { post: { select: { id: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async listActiveByCreator(creatorId: string, cursor?: string, limit = 20) {
    return prisma.bundle.findMany({
      where: { creatorId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        items: {
          include: {
            post: {
              select: {
                id: true,
                content: true,
                media: { take: 1, select: { thumbnailUrl: true } },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async incrementPurchaseCount(bundleId: string) {
    return prisma.bundle.update({
      where: { id: bundleId },
      data: { purchaseCount: { increment: 1 } },
    });
  }

  async setItemCount(bundleId: string, itemCount: number) {
    return prisma.bundle.update({
      where: { id: bundleId },
      data: { itemCount },
    });
  }
}
