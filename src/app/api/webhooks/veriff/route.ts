import { NextResponse } from 'next/server';

import { webhookController } from '@/app/api/_controllers/webhookController';

/**
 * GET - User redirect after completing Veriff verification
 * This is where Veriff sends the user after they finish the verification flow
 */
export async function GET() {
  // Redirect user back to the KYC verification page
  // The page will fetch the current status and show appropriate UI
  return NextResponse.redirect(
    new URL('/creator/verify', process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000')
  );
}

/**
 * POST - Webhook from Veriff server with verification decision
 */
export async function POST(req: Request) {
  return webhookController.handleVeriff(req as unknown as import('next/server').NextRequest);
}
