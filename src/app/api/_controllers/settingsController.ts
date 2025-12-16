import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { SettingsRepository } from '@/repositories/settingsRepository';
import { SettingsService } from '@/services/settingsService';

const settingsService = new SettingsService(new SettingsRepository());

export class SettingsController {
  async get(): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const settings = await settingsService.getSettings(userId);
    if (!settings) {
      return NextResponse.json(
        { error: { code: 'SETTINGS_NOT_FOUND', message: 'Settings not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json(settings);
  }

  async update(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const body = (await req.json()) ?? {};

    try {
      const updated = await settingsService.updateSettings(userId, {
        notifications: body.notifications,
        privacy: body.privacy,
      });
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json(
        { error: { code: 'UNKNOWN_ERROR', message: 'Unable to update settings.' } },
        { status: 500 }
      );
    }
  }
}

export const settingsController = new SettingsController();
