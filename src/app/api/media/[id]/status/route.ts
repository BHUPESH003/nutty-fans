import { contentController } from '@/app/api/_controllers/contentController';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return contentController.getMediaStatus(id);
}
