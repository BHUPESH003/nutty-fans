import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    reason?: string;
    description?: string;
  };

  const reason =
    typeof body.reason === 'string' && body.reason.trim().length > 0
      ? body.reason.trim().slice(0, 50)
      : 'chat_abuse';
  const description =
    typeof body.description === 'string' && body.description.trim().length > 0
      ? body.description.trim()
      : null;

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      participant1: true,
      participant2: true,
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: { message: 'Conversation not found' } }, { status: 404 });
  }

  const reporterId = session.user.id;
  if (conversation.participant1 !== reporterId && conversation.participant2 !== reporterId) {
    return NextResponse.json({ error: { message: 'Forbidden' } }, { status: 403 });
  }

  const reportedId =
    conversation.participant1 === reporterId
      ? conversation.participant2
      : conversation.participant1;

  const report = await prisma.report.create({
    data: {
      reporterId,
      reportedType: 'user',
      reportedId,
      reason,
      description,
      metadata: {
        source: 'chat_menu',
        conversationId: conversation.id,
      },
    },
    select: { id: true, status: true },
  });

  return NextResponse.json({ success: true, report });
}
