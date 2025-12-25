import { getServerSession } from 'next-auth';

import { publicCreatorController } from '@/app/api/_controllers/publicCreatorController';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') ?? undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
  const session = await getServerSession(authOptions);
  return publicCreatorController.getPublicPostsByHandle(handle, session?.user?.id, {
    cursor,
    limit,
  });
}
