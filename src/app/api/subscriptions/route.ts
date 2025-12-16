import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';

import { paymentController } from '../_controllers/paymentController';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined;
  return paymentController.getSubscriptions(session.user.id, cursor);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { creatorId, planType } = body;

  if (!creatorId) {
    return NextResponse.json({ error: { message: 'Creator ID is required' } }, { status: 400 });
  }

  return paymentController.subscribe(creatorId, session.user.id, planType);
}
