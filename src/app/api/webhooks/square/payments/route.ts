/**
 * Square Payment Webhook Route
 *
 * Handles Square payment webhooks for wallet top-ups.
 * Uses gateway adapter for signature verification.
 */

import { NextRequest, NextResponse } from 'next/server';

import { squareAdapter } from '@/services/gateways';
import { paymentService } from '@/services/payments/paymentService';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-square-hmac-sha256');
    const url = request.url;
    const bodyText = await request.text();

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Parse and verify webhook using gateway adapter
    const event = squareAdapter.parseWebhookEvent(bodyText, signature, url);

    if (!event) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    // Handle payment events
    if (event.type === 'payment.completed') {
      // Extract user ID from reference
      const userId = event.referenceId;
      if (userId) {
        await paymentService.completeTopUp(userId, event.amount, event.paymentId);
        console.warn(`Wallet top-up completed: user=${userId}, amount=${event.amount}`);
      } else {
        console.warn('Payment completed but no user reference:', event.paymentId);
      }
    } else if (event.type === 'payment.failed') {
      console.warn('Payment failed:', event.paymentId);
    } else if (event.type === 'payment.refunded') {
      console.warn('Payment refunded:', event.paymentId);
      // Refunds are handled via admin action, not automatically
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Webhook failed';
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}
