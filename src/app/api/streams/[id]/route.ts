import { getServerSession } from 'next-auth';

import { liveStreamController } from '@/app/api/_controllers/liveStreamController';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  return liveStreamController.get(id, session?.user?.id);
}
