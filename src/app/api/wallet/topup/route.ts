import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';

import { paymentController } from '../../_controllers/paymentController';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const body = await request.json();
  if (!body.amount || typeof body.amount !== 'number') {
    return NextResponse.json({ error: { message: 'Amount is required' } }, { status: 400 });
  }

  return paymentController.topupWallet(session.user.id, body.amount);
}
