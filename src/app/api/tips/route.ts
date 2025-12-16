import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';

import { paymentController } from '../_controllers/paymentController';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const body = await request.json();

  if (!body.creatorId || !body.amount) {
    return NextResponse.json(
      { error: { message: 'creatorId and amount are required' } },
      { status: 400 }
    );
  }

  return paymentController.sendTip(session.user.id, {
    creatorId: body.creatorId,
    amount: body.amount,
    message: body.message,
    relatedType: body.relatedType,
    relatedId: body.relatedId,
    paymentSource: body.paymentSource || 'wallet',
  });
}
