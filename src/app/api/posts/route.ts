import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { contentController } from '@/app/api/_controllers/contentController';
import { authOptions } from '@/lib/auth/authOptions';
import { AuthUser } from '@/types/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const body = await req.json();
  return contentController.createPost(session.user as AuthUser, body);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  return contentController.listMyPosts(session.user.id, {
    status: searchParams.get('status') ?? undefined,
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
  });
}
