import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { liveStreamController } from '@/app/api/_controllers/liveStreamController';
import { authOptions } from '@/lib/auth/authOptions';
import { creatorAccessService } from '@/services/creator/creatorAccess';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  try {
    await creatorAccessService.requireCreatorIdByUserId(session.user.id);
  } catch {
    return NextResponse.json({ error: { message: 'Creator profile not found' } }, { status: 403 });
  }

  return liveStreamController.listMine(session.user.id);
}
