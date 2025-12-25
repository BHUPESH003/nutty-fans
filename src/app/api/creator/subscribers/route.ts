import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { creatorAccessService } from '@/services/creator/creatorAccess';

import { paymentController } from '../../_controllers/paymentController';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  let creatorId: string;
  try {
    creatorId = await creatorAccessService.requireCreatorIdByUserId(session.user.id);
  } catch {
    return NextResponse.json({ error: { message: 'Creator profile not found' } }, { status: 403 });
  }

  const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined;
  return paymentController.getCreatorSubscribers(creatorId, cursor);
}
