import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';

import { messagingController } from '../_controllers/messagingController';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined;
  return messagingController.listConversations(session.user.id, cursor);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { participantId } = body;

  if (!participantId) {
    return NextResponse.json({ error: { message: 'Participant ID is required' } }, { status: 400 });
  }

  return messagingController.createConversation(session.user.id, participantId);
}
