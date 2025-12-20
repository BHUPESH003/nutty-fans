import { cacheService, cacheKeys } from '@/lib/cache/cacheService';
import { ProfileRepository } from '@/repositories/profileRepository';

type PublicProfile = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  location?: string | null;
  joinDate: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
};

type SelfProfile = PublicProfile & {
  isDiscoverable: boolean;
  showLocation: boolean;
};

type UpdateProfileInput = {
  displayName?: string;
  bio?: string | null;
  location?: string | null;
  isDiscoverable?: boolean;
  showLocation?: boolean;
};

export class ProfileService {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly repo: ProfileRepository) {}

  async getSelfProfile(userId: string): Promise<SelfProfile | null> {
    // Cache profile for 2 minutes
    const cacheKey = cacheKeys.userProfile(userId);

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const user = await this.repo.findById(userId);
        if (!user) return null;

        const stats = await this.repo.getStats(user.id);
        return {
          displayName: user.displayName,
          username: user.username,
          avatarUrl: user.avatarUrl,
          bio: user.bio ?? null,
          location: user.location ?? null,
          isDiscoverable: user.isDiscoverable,
          showLocation: user.showLocation,
          joinDate: user.createdAt.toISOString(),
          followersCount: stats.followersCount,
          followingCount: stats.followingCount,
          postsCount: stats.postsCount,
        };
      },
      2 * 60 * 1000 // 2 minutes cache
    );
  }

  async getPublicProfile(username: string): Promise<PublicProfile | null> {
    // Cache public profile for 5 minutes
    const cacheKey = `profile:public:${username}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const user = await this.repo.findByUsername(username);
        if (!user) return null;

        const stats = await this.repo.getStats(user.id);

        const base: PublicProfile = {
          displayName: user.displayName,
          username: user.username,
          avatarUrl: user.avatarUrl,
          bio: user.bio ?? null,
          joinDate: user.createdAt.toISOString(),
          followersCount: stats.followersCount,
          followingCount: stats.followingCount,
          postsCount: stats.postsCount,
        };

        if (user.showLocation && user.location) {
          return { ...base, location: user.location };
        }

        return base;
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<SelfProfile> {
    const errors: Record<string, string[]> = {};

    if (input.displayName !== undefined) {
      const value = input.displayName.trim();
      if (!value) {
        errors['displayName'] = ['Display name is required'];
      } else if (value.length > 50) {
        errors['displayName'] = ['Display name must be under 50 characters'];
      }
    }

    if (input.bio !== undefined && input.bio !== null && input.bio.length > 160) {
      errors['bio'] = ['Bio must be under 160 characters'];
    }

    if (input.location !== undefined && input.location !== null && input.location.length > 100) {
      errors['location'] = ['Location must be under 100 characters'];
    }

    if (Object.keys(errors).length > 0) {
      const error = new Error('Validation failed');
      // @ts-expect-error attach structured details
      error.details = errors;
      throw error;
    }

    const updated = await this.repo.updateProfile(userId, {
      displayName: input.displayName,
      bio: input.bio,
      location: input.location,
      isDiscoverable: input.isDiscoverable ?? undefined,
      showLocation: input.showLocation ?? undefined,
    });

    const stats = await this.repo.getStats(updated.id);
    return {
      displayName: updated.displayName,
      username: updated.username,
      avatarUrl: updated.avatarUrl,
      bio: updated.bio ?? null,
      location: updated.location ?? null,
      isDiscoverable: updated.isDiscoverable,
      showLocation: updated.showLocation,
      joinDate: updated.createdAt.toISOString(),
      followersCount: stats.followersCount,
      followingCount: stats.followingCount,
      postsCount: stats.postsCount,
    };
  }
}
