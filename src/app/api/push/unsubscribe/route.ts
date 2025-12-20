import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import { errorResponse, successResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { pushNotificationService } from '@/services/notifications/pushNotificationService';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return errorResponse('Endpoint is required', 400);
    }

    await pushNotificationService.unregisterSubscription(session.user.id, endpoint);

    return successResponse({ success: true }, 'Push subscription unregistered');
  } catch (error) {
    console.error('Failed to unregister push subscription:', error);
    return errorResponse('Failed to unregister push subscription', 500);
  }
}
