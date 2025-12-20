import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { errorResponse, successResponse } from '@/lib/api/response';
import { pushNotificationService } from '@/services/notifications/pushNotificationService';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return errorResponse('Invalid subscription data', 400);
    }

    await pushNotificationService.registerSubscription(session.user.id, {
      userId: session.user.id,
      endpoint,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return successResponse({ success: true }, 'Push subscription registered');
  } catch (error) {
    console.error('Failed to register push subscription:', error);
    return errorResponse('Failed to register push subscription', 500);
  }
}
