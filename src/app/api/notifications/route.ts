import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';

import { notificationController } from '../_controllers/notificationController';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined;
  return notificationController.list(session.user.id, cursor);
}
