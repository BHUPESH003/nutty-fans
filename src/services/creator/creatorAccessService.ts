import { CreatorRepository } from '@/repositories/creatorRepository';

/**
 * CreatorAccessService
 *
 * Small helper service to resolve creatorId for a logged-in user.
 * Keeps Prisma access inside repositories.
 */
export class CreatorAccessService {
  constructor(private readonly creatorRepo = new CreatorRepository()) {}

  async requireCreatorIdByUserId(userId: string): Promise<string> {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Creator profile not found');
    }
    return profile.id;
  }
}
