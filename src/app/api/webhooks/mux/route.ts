import { NextResponse } from 'next/server';

import { contentController } from '@/app/api/_controllers/contentController';
import { muxClient } from '@/services/integrations/mux/muxClient';

export async function POST(req: Request) {
  // Get raw body for signature verification
  const rawBody = await req.text();

  // Get signature headers
  const signature = req.headers.get('mux-signature') ?? '';
  const timestamp = signature.match(/t=(\d+)/)?.[1] ?? '';
  const sig = signature.match(/v1=(\w+)/)?.[1] ?? '';

  // Verify signature
  if (!muxClient.verifyWebhookSignature(rawBody, `v1=${sig}`, timestamp)) {
    console.warn('Invalid Mux webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Parse and handle
  const payload = JSON.parse(rawBody);
  return contentController.handleMuxWebhook(payload);
}

// Disable body parsing to get raw body
export const config = {
  api: {
    bodyParser: false,
  },
};
