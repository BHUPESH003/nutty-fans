import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { successResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { MessageService } from '@/services/messaging/messageService';
import { TipService } from '@/services/payments/tipService';

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

  const tipService = new TipService();
  const messageService = new MessageService();

  const tipTransaction = await tipService.sendTip(session.user.id, {
    creatorId: body.creatorId,
    amount: body.amount,
    message: body.message ?? body.note,
    relatedType: body.relatedType,
    relatedId: body.relatedId,
  });

  const conversationId = body.conversationId;
  if (conversationId) {
    const note: string = body.message ?? body.note ?? '';

    // Create a tip message in the conversation thread.
    await messageService.send(
      session.user.id,
      conversationId,
      note,
      undefined,
      undefined,
      undefined,
      {
        amount: body.amount,
        note,
        tipId: tipTransaction.id,
      },
      'tip'
    );
  }

  return successResponse(tipTransaction, 'Tip sent successfully', 201);
}
