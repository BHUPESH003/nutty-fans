import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { contentController } from '@/app/api/_controllers/contentController';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  return contentController.getUserBookmarks(
    session.user.id,
    searchParams.get('cursor') ?? undefined,
    searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
  );
}
