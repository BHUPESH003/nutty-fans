import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { broadcastController } from '@/app/api/_controllers/broadcastController';
import { authOptions } from '@/lib/auth/authOptions';
import { creatorAccessService } from '@/services/creator/creatorAccess';

export async function GET(_req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const creatorId = await creatorAccessService.requireCreatorIdByUserId(session.user.id);

  // Cursor handled client-side for now; query parsing can be added later.
  return broadcastController.list(creatorId);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const creatorId = await creatorAccessService.requireCreatorIdByUserId(session.user.id);

  const body = await request.json().catch(() => ({}));

  return broadcastController.create(creatorId, body);
}
