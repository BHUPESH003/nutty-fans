import { creatorController } from '@/app/api/_controllers/creatorController';

export async function PATCH(req: Request) {
  return creatorController.updateSubscription(req as unknown as import('next/server').NextRequest);
}
