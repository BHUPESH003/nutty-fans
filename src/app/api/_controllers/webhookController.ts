import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { CreatorRepository } from '@/repositories/creatorRepository';
import { KycService } from '@/services/creator/kycService';
import { squareClient } from '@/services/integrations/square/squareClient';

const creatorRepo = new CreatorRepository();
const kycService = new KycService(creatorRepo);

export class WebhookController {
  /**
   * POST /api/webhooks/veriff — Veriff KYC webhook
   */
  async handleVeriff(req: NextRequest): Promise<NextResponse> {
    const signature = req.headers.get('x-hmac-signature') ?? '';
    const payload = await req.text();

    // Verify signature
    if (!kycService.verifySignature(payload, signature)) {
      console.error('Invalid Veriff webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    try {
      const webhookPayload = JSON.parse(payload);
      await kycService.processWebhook(webhookPayload);
      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Error processing Veriff webhook:', error);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  }

  /**
   * POST /api/webhooks/square — Square webhook
   */
  async handleSquare(req: NextRequest): Promise<NextResponse> {
    const signature = req.headers.get('x-square-hmacsha256-signature') ?? '';
    const payload = await req.text();
    const url = req.url;

    // Verify signature
    if (!squareClient.verifyWebhookSignature(payload, signature, url)) {
      console.error('Invalid Square webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    try {
      const event = JSON.parse(payload);

      // Handle different event types
      switch (event.type) {
        case 'payout.sent':
          // Update payout status
          console.warn('Payout sent:', event.data.id);
          break;
        case 'payout.failed':
          // Handle failed payout
          console.error('Payout failed:', event.data.id);
          break;
        default:
          console.warn('Webhook event processed:', event.type);
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Error processing Square webhook:', error);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  }
}

export const webhookController = new WebhookController();
