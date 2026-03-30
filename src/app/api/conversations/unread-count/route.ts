import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const userId = session.user.id;

  // User may be participant1 in some conversations and participant2 in others.
  // Sum the correct unread column for each case.
  const [asUser1, asUser2] = await Promise.all([
    prisma.conversation.aggregate({
      where: { participant1: userId },
      _sum: { unreadCount1: true },
    }),
    prisma.conversation.aggregate({
      where: { participant2: userId },
      _sum: { unreadCount2: true },
    }),
  ]);

  const count = (asUser1._sum.unreadCount1 ?? 0) + (asUser2._sum.unreadCount2 ?? 0);

  return NextResponse.json({ count });
}
