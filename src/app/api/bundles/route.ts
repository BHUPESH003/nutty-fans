import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { bundleController } from '@/app/api/_controllers/bundleController';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') ?? undefined;
  return bundleController.listMyBundles(session.user.id, cursor);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  return bundleController.createMyBundle(session.user.id, body);
}
