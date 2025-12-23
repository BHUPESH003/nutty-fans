/**
 * Wallet Top-Up Checkout Route
 *
 * Creates a checkout session for wallet funding.
 * Uses PaymentService.topUpWallet() - the only way to fund wallet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { paymentService } from '@/services/payments/paymentService';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const body = await request.json();

  try {
    // Only amount is needed - wallet top-up only
    const amount = body.amount;
    if (!amount || amount < 5) {
      return NextResponse.json(
        { error: { message: 'Minimum top-up amount is $5' } },
        { status: 400 }
      );
    }

    const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
    const successUrl = body.successUrl ?? `${baseUrl}/wallet?success=true`;
    const cancelUrl = body.cancelUrl ?? `${baseUrl}/wallet?cancelled=true`;

    const result = await paymentService.topUpWallet(session.user.id, amount, successUrl, cancelUrl);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}
