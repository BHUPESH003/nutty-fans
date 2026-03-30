import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { blocked?: boolean; reason?: string };
  const blocked = Boolean(body.blocked);
  const reason = typeof body.reason === 'string' ? body.reason.trim() : null;

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      participant1: true,
      participant2: true,
      blockedBy: true,
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: { message: 'Conversation not found' } }, { status: 404 });
  }

  const myId = session.user.id;
  if (conversation.participant1 !== myId && conversation.participant2 !== myId) {
    return NextResponse.json({ error: { message: 'Forbidden' } }, { status: 403 });
  }

  const otherUserId =
    conversation.participant1 === myId ? conversation.participant2 : conversation.participant1;

  if (blocked) {
    await prisma.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: myId,
          blockedId: otherUserId,
        },
      },
      create: {
        blockerId: myId,
        blockedId: otherUserId,
        reason: reason || null,
      },
      update: {
        reason: reason || undefined,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: {
        isBlocked: true,
        blockedBy: myId,
      },
    });

    return NextResponse.json({ success: true, blocked: true });
  }

  await prisma.block.deleteMany({
    where: {
      blockerId: myId,
      blockedId: otherUserId,
    },
  });

  if (conversation.blockedBy === myId) {
    await prisma.conversation.update({
      where: { id },
      data: {
        isBlocked: false,
        blockedBy: null,
      },
    });
  }

  return NextResponse.json({ success: true, blocked: false });
}
