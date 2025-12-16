import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';

import { paymentController } from '../../../_controllers/paymentController';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const { postId } = await params;
  const body = await request.json().catch(() => ({}));
  const paymentSource = body.paymentSource || 'wallet';

  return paymentController.purchasePpv(session.user.id, postId, paymentSource);
}
