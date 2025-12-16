import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { PaymentService } from '@/services/payments/paymentService';

const paymentService = new PaymentService();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const body = await request.json();

  try {
    const result = await paymentService.createCheckout({
      userId: session.user.id,
      amount: body.amount,
      currency: body.currency,
      lineItems: body.lineItems,
      redirectUrl: body.redirectUrl,
      metadata: body.metadata,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}
