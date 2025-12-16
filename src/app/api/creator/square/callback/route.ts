import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { PayoutRepository } from '@/repositories/payoutRepository';
import { PaymentService } from '@/services/creator/paymentService';

const paymentService = new PaymentService(new CreatorRepository(), new PayoutRepository());

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/creator/payouts/setup?error=denied', req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/creator/payouts/setup?error=missing_params', req.url));
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    // In production, verify state matches session state
    await paymentService.completeConnection(userId, code);
    return NextResponse.redirect(new URL('/creator/dashboard?connected=true', req.url));
  } catch (err) {
    console.error('Square OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/creator/payouts/setup?error=connection_failed', req.url)
    );
  }
}
