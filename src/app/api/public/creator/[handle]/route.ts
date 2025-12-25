import { getServerSession } from 'next-auth';

import { publicCreatorController } from '@/app/api/_controllers/publicCreatorController';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(_req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const session = await getServerSession(authOptions);
  return publicCreatorController.getPublicProfile(handle, session?.user?.id);
}
