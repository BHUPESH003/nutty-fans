import { prisma } from '@/lib/db/prisma';

export class SessionService {
  async invalidateAllUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
}
