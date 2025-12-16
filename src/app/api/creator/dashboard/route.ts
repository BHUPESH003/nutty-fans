import { creatorController } from '@/app/api/_controllers/creatorController';

export async function GET(req: Request) {
  return creatorController.getDashboard(req as unknown as import('next/server').NextRequest);
}
