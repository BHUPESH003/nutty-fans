import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { contentController } from '@/app/api/_controllers/contentController';
import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!creator) {
    return NextResponse.json({ error: { message: 'Creator profile not found' } }, { status: 403 });
  }

  const body = await req.json();
  return contentController.getUploadUrl(creator.id, body);
}
