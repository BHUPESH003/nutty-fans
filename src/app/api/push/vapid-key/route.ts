import { successResponse } from '@/lib/api/response';
import { pushNotificationService } from '@/services/notifications/pushNotificationService';

export async function GET() {
  const publicKey = pushNotificationService.getVapidPublicKey();
  return successResponse({ publicKey }, 'VAPID public key');
}
