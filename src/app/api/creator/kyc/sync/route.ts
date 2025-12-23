import { creatorController } from '@/app/api/_controllers/creatorController';

export async function POST() {
  return creatorController.syncKycStatus();
}
