import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/db/prisma';
import { creatorAccessService } from '@/services/creator/creatorAccess';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const creatorId = await creatorAccessService.requireCreatorIdByUserId(session.user.id);
  const { id } = await params;

  const broadcast = await prisma.broadcast.findUnique({ where: { id, creatorId } });
  if (!broadcast) return NextResponse.json({ error: { message: 'Not found' } }, { status: 404 });

  return NextResponse.json({ data: broadcast });
}
