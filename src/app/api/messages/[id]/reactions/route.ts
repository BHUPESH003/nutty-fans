import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/db/prisma';
import { emitMessageReaction } from '@/lib/realtime/wsEmitter';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const { id: messageId } = await params;
  const body = await request.json().catch(() => ({}));
  const emoji = typeof body.emoji === 'string' ? body.emoji : null;
  if (!emoji) {
    return NextResponse.json({ error: { message: 'emoji is required' } }, { status: 400 });
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, conversationId: true },
  });

  if (!message) {
    return NextResponse.json({ error: { message: 'Message not found' } }, { status: 404 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: message.conversationId },
    select: { participant1: true, participant2: true },
  });

  if (
    !conversation ||
    (conversation.participant1 !== session.user.id && conversation.participant2 !== session.user.id)
  ) {
    return NextResponse.json({ error: { message: 'Forbidden' } }, { status: 403 });
  }

  // Toggle reaction (best-effort)
  const existing = await prisma.messageReaction.findFirst({
    where: {
      messageId,
      userId: session.user.id,
      emoji,
    },
    select: { id: true },
  });

  let action: 'added' | 'removed' = 'added';

  if (existing) {
    await prisma.messageReaction.delete({
      where: { id: existing.id },
    });
    action = 'removed';
  } else {
    try {
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId: session.user.id,
          emoji,
        },
      });
    } catch (error) {
      // Race-safe toggle: if duplicate create happened in parallel, treat this as remove.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        await prisma.messageReaction.deleteMany({
          where: {
            messageId,
            userId: session.user.id,
            emoji,
          },
        });
        action = 'removed';
      } else {
        throw error;
      }
    }
  }

  await emitMessageReaction(message.conversationId, {
    messageId,
    emoji,
    userId: session.user.id,
    action,
  });

  return NextResponse.json({ success: true, action });
}
