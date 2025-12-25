import { getServerSession } from 'next-auth';

import { bundleController } from '@/app/api/_controllers/bundleController';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') ?? undefined;

  const session = await getServerSession(authOptions);
  return bundleController.listPublicByHandle(handle, session?.user?.id, cursor);
}
