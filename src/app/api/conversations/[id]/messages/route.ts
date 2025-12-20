import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { AuthUser } from '@/types/auth';

import { messagingController } from '../../../_controllers/messagingController';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return messagingController.sendMessage(session.user as AuthUser, id, body);
}
