import { NextRequest, NextResponse } from 'next/server';

import { PaymentService } from '@/services/payments/paymentService';
import type { SquarePaymentWebhookEvent } from '@/types/payments';

const paymentService = new PaymentService();

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-square-hmac-sha256');
    const url = request.url; // Or the configured webhook URL
    const bodyText = await request.text();

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Parse body after getting text for signature verification
    const event = JSON.parse(bodyText) as SquarePaymentWebhookEvent;

    await paymentService.processWebhook(event, signature, url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Webhook failed';
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}
