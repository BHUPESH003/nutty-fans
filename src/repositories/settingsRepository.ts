import { prisma } from '@/lib/db/prisma';

export class SettingsRepository {
  async getByUserId(userId: string) {
    let settings = await prisma.userNotificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.userNotificationSettings.create({
        data: {
          userId,
        },
      });
    }

    return settings;
  }

  async update(
    userId: string,
    data: Partial<{
      emailNotifications: boolean;
      marketingEmails: boolean;
      platformUpdates: boolean;
      profileDiscoverable: boolean;
      showLocation: boolean;
    }>
  ) {
    return prisma.userNotificationSettings.update({
      where: { userId },
      data,
    });
  }
}
