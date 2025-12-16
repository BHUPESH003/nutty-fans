import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { contentController } from '@/app/api/_controllers/contentController';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);

  return contentController.getComments(
    id,
    session?.user?.id,
    searchParams.get('cursor') ?? undefined,
    searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const body = await req.json();
  return contentController.createComment(id, session.user.id, body);
}
