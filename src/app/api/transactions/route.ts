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
  const type = request.nextUrl.searchParams.get('type') ?? undefined;

  return paymentController.getUserTransactions(session.user.id, cursor, type);
}
