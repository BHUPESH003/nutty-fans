import { creatorController } from '@/app/api/_controllers/creatorController';

export async function POST(req: Request) {
  return creatorController.apply(req as unknown as import('next/server').NextRequest);
}
