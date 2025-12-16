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

  // Get creator profile for user
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!creator) {
    return NextResponse.json({ error: { message: 'Creator profile not found' } }, { status: 403 });
  }

  const body = await req.json();
  return contentController.createPost(creator.id, body);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  // Get creator profile for user
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!creator) {
    return NextResponse.json({ error: { message: 'Creator profile not found' } }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  return contentController.listCreatorPosts(creator.id, {
    status: searchParams.get('status') ?? undefined,
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
  });
}
