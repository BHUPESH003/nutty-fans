import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { contentController } from '@/app/api/_controllers/contentController';
import { authOptions } from '@/lib/auth/authOptions';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  return contentController.publishMyPost(id, session.user.id);
}
