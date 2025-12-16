import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';

import { paymentController } from '../../_controllers/paymentController';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const creatorProfile = await paymentController.getCreatorProfile(session.user.id);
  if (!creatorProfile) {
    return NextResponse.json({ error: { message: 'Creator profile not found' } }, { status: 403 });
  }

  const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined;
  return paymentController.getCreatorSubscribers(creatorProfile.id, cursor);
}
