import { prisma } from '@/lib/db/prisma';
import { SettingsRepository } from '@/repositories/settingsRepository';

type SettingsResponse = {
  email: string;
  legalName: string | null;
  notifications: {
    emailNotifications: boolean;
    marketingEmails: boolean;
    platformUpdates: boolean;
  };
  privacy: {
    profileDiscoverable: boolean;
    showLocation: boolean;
  };
};

type UpdateSettingsInput = {
  notifications?: Partial<SettingsResponse['notifications']>;
  privacy?: Partial<SettingsResponse['privacy']>;
};

export class SettingsService {
  constructor(private readonly repo: SettingsRepository) {}

  async getSettings(userId: string): Promise<SettingsResponse | null> {
    const [user, settings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          metadata: true,
        },
      }),
      this.repo.getByUserId(userId),
    ]);

    if (!user) return null;

    const metadata = (user.metadata ?? {}) as Record<string, unknown>;
    const legalName = (metadata['legalName'] as string | undefined) ?? null;

    return {
      email: user.email,
      legalName,
      notifications: {
        emailNotifications: settings.emailNotifications,
        marketingEmails: settings.marketingEmails,
        platformUpdates: settings.platformUpdates,
      },
      privacy: {
        profileDiscoverable: settings.profileDiscoverable,
        showLocation: settings.showLocation,
      },
    };
  }

  async updateSettings(userId: string, input: UpdateSettingsInput): Promise<SettingsResponse> {
    const partial: Parameters<SettingsRepository['update']>[1] = {};

    if (input.notifications) {
      if (input.notifications.emailNotifications !== undefined) {
        partial.emailNotifications = input.notifications.emailNotifications;
      }
      if (input.notifications.marketingEmails !== undefined) {
        partial.marketingEmails = input.notifications.marketingEmails;
      }
      if (input.notifications.platformUpdates !== undefined) {
        partial.platformUpdates = input.notifications.platformUpdates;
      }
    }

    if (input.privacy) {
      if (input.privacy.profileDiscoverable !== undefined) {
        partial.profileDiscoverable = input.privacy.profileDiscoverable;
      }
      if (input.privacy.showLocation !== undefined) {
        partial.showLocation = input.privacy.showLocation;
      }
    }

    const updatedSettings = await this.repo.update(userId, partial);

    // Keep User flags in sync with settings.
    await prisma.user.update({
      where: { id: userId },
      data: {
        isDiscoverable: updatedSettings.profileDiscoverable,
        showLocation: updatedSettings.showLocation,
      },
    });

    const current = await this.getSettings(userId);
    if (!current) {
      throw new Error('Settings not found after update');
    }
    return current;
  }
}
