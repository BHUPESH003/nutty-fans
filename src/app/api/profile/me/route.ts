import { profileController } from '@/app/api/_controllers/profileController';

export async function GET() {
  return profileController.me();
}
