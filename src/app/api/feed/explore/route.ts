import { getServerSession } from 'next-auth';

import { contentController } from '@/app/api/_controllers/contentController';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);

  return contentController.getExploreFeed(
    searchParams.get('cursor') ?? undefined,
    searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    session?.user?.id
  );
}
