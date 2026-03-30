import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/db/prisma';

type ConversationMetadata = {
  mutedBy?: string[];
  favoritedBy?: string[];
  hiddenBy?: string[];
  restrictedBy?: string[];
};

function parseMetadata(raw: unknown): ConversationMetadata {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as ConversationMetadata;
}

function ensureArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function applyToggle(base: string[], userId: string, enabled: boolean) {
  const set = new Set(base);
  if (enabled) set.add(userId);
  else set.delete(userId);
  return Array.from(set);
}

async function getConversationOrDeny(userId: string, id: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      participant1: true,
      participant2: true,
      metadata: true,
      isBlocked: true,
      blockedBy: true,
    },
  });

  if (!conversation) {
    return {
      error: NextResponse.json({ error: { message: 'Conversation not found' } }, { status: 404 }),
    };
  }

  if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
    return { error: NextResponse.json({ error: { message: 'Forbidden' } }, { status: 403 }) };
  }

  return { conversation };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const { id } = await params;
  const result = await getConversationOrDeny(session.user.id, id);
  if ('error' in result) return result.error;

  const metadata = parseMetadata(result.conversation.metadata);
  const userId = session.user.id;

  return NextResponse.json({
    muted: ensureArray(metadata.mutedBy).includes(userId),
    favorited: ensureArray(metadata.favoritedBy).includes(userId),
    hidden: ensureArray(metadata.hiddenBy).includes(userId),
    restricted: ensureArray(metadata.restrictedBy).includes(userId),
    blocked: result.conversation.isBlocked,
    blockedBy: result.conversation.blockedBy,
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Partial<{
    muted: boolean;
    favorited: boolean;
    hidden: boolean;
    restricted: boolean;
  }>;

  const result = await getConversationOrDeny(session.user.id, id);
  if ('error' in result) return result.error;

  const userId = session.user.id;
  const current = parseMetadata(result.conversation.metadata);

  const metadata: ConversationMetadata = {
    ...current,
    mutedBy:
      typeof body.muted === 'boolean'
        ? applyToggle(ensureArray(current.mutedBy), userId, body.muted)
        : ensureArray(current.mutedBy),
    favoritedBy:
      typeof body.favorited === 'boolean'
        ? applyToggle(ensureArray(current.favoritedBy), userId, body.favorited)
        : ensureArray(current.favoritedBy),
    hiddenBy:
      typeof body.hidden === 'boolean'
        ? applyToggle(ensureArray(current.hiddenBy), userId, body.hidden)
        : ensureArray(current.hiddenBy),
    restrictedBy:
      typeof body.restricted === 'boolean'
        ? applyToggle(ensureArray(current.restrictedBy), userId, body.restricted)
        : ensureArray(current.restrictedBy),
  };

  await prisma.conversation.update({
    where: { id },
    data: { metadata: metadata as unknown as object },
  });

  return NextResponse.json({
    success: true,
    muted: metadata.mutedBy?.includes(userId) ?? false,
    favorited: metadata.favoritedBy?.includes(userId) ?? false,
    hidden: metadata.hiddenBy?.includes(userId) ?? false,
    restricted: metadata.restrictedBy?.includes(userId) ?? false,
  });
}
