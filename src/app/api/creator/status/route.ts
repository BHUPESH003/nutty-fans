import { creatorController } from '@/app/api/_controllers/creatorController';

export async function GET() {
  return creatorController.getStatus();
}
