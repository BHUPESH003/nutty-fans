import { liveStreamController } from '@/app/api/_controllers/liveStreamController';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') ?? undefined;
  return liveStreamController.listLive(cursor);
}
