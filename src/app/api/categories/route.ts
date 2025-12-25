import { categoryController } from '@/app/api/_controllers/categoryController';

export async function GET() {
  return categoryController.list();
}
