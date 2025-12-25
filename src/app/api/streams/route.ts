import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { liveStreamController } from '@/app/api/_controllers/liveStreamController';
import { authOptions } from '@/lib/auth/authOptions';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  return liveStreamController.create(session.user.id, body);
}
