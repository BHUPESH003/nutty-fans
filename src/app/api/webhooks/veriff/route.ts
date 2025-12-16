import { webhookController } from '@/app/api/_controllers/webhookController';

export async function POST(req: Request) {
  return webhookController.handleVeriff(req as unknown as import('next/server').NextRequest);
}
