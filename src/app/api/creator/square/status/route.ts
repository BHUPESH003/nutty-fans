import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { PayoutRepository } from '@/repositories/payoutRepository';
import { PaymentService } from '@/services/creator/creatorPayoutService';

const paymentService = new PaymentService(new CreatorRepository(), new PayoutRepository());

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ isConnected: false });
  }

  try {
    const status = await paymentService.getConnectionStatus(userId);
    return NextResponse.json(status);
  } catch (error) {
    console.error('Failed to get Square status:', error);
    return NextResponse.json({ isConnected: false });
  }
}
