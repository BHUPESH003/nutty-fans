import { prisma } from '@/lib/db/prisma';

export class ProfileRepository {
  findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        bio: true,
        location: true,
        isDiscoverable: true,
        showLocation: true,
        createdAt: true,
      },
    });
  }

  findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        bio: true,
        location: true,
        isDiscoverable: true,
        showLocation: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(
    userId: string,
    data: Partial<{
      displayName: string;
      bio: string | null;
      location: string | null;
      isDiscoverable: boolean;
      showLocation: boolean;
    }>
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        bio: true,
        location: true,
        isDiscoverable: true,
        showLocation: true,
        createdAt: true,
      },
    });
  }

  async getStats(userId: string): Promise<{ followersCount: number; followingCount: number }> {
    // Followers: users following this user as creator.
    const followersCount = await prisma.follow.count({
      where: { creator: { userId } },
    });

    // Following: number of creators this user follows.
    const followingCount = await prisma.follow.count({
      where: { followerId: userId },
    });

    return { followersCount, followingCount };
  }

  async updateAvatarUrl(userId: string, avatarUrl: string | null) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        avatarUrl: true,
      },
    });
  }
}
