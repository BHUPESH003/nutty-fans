import { creatorController } from '@/app/api/_controllers/creatorController';

export async function GET() {
  return creatorController.getProfile();
}

export async function PATCH(req: Request) {
  return creatorController.updateProfile(req as unknown as import('next/server').NextRequest);
}
