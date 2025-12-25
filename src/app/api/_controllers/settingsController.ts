import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import { successResponse, errorResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { SettingsRepository } from '@/repositories/settingsRepository';
import { UserRepository } from '@/repositories/userRepository';
import { SettingsService } from '@/services/settingsService';

const settingsService = new SettingsService(new SettingsRepository(), new UserRepository());

export class SettingsController {
  async get() {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return errorResponse('Authentication required.', 401, { code: 'AUTH_REQUIRED' });
    }

    const settings = await settingsService.getSettings(userId);
    if (!settings) {
      return errorResponse('Settings not found.', 404, { code: 'SETTINGS_NOT_FOUND' });
    }

    return successResponse(settings);
  }

  async update(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return errorResponse('Authentication required.', 401, { code: 'AUTH_REQUIRED' });
    }

    const body = (await req.json()) ?? {};

    try {
      const updated = await settingsService.updateSettings(userId, {
        notifications: body.notifications,
        privacy: body.privacy,
      });
      return successResponse(updated, 'Settings updated successfully.');
    } catch {
      return errorResponse('Unable to update settings.', 500, { code: 'UNKNOWN_ERROR' });
    }
  }
}

export const settingsController = new SettingsController();
