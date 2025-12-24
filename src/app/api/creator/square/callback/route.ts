import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { PayoutRepository } from '@/repositories/payoutRepository';
import { PaymentService } from '@/services/creator/creatorPayoutService';
import { validateOAuthCallback } from '@/services/integrations/square/oauthBuilder';

const paymentService = new PaymentService(new CreatorRepository(), new PayoutRepository());

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Log callback parameters for debugging
  console.warn('[Square OAuth Callback] Received:', {
    hasCode: !!code,
    hasState: !!state,
    error: error || 'none',
    errorDescription: errorDescription || 'none',
  });

  // Handle error from Square
  if (error) {
    console.error('[Square OAuth Callback] Authorization denied:', {
      error,
      description: errorDescription,
    });
    return NextResponse.redirect(
      new URL(
        `/creator/payouts/setup?error=denied&message=${encodeURIComponent(errorDescription || error)}`,
        req.url
      )
    );
  }

  // Validate callback parameters
  // TODO: In production, retrieve stored state from session/cookie/DB
  const storedState: string | null = null; // Replace with actual stored state lookup

  const validation = validateOAuthCallback({
    code,
    state,
    error,
    storedState, // Will skip state comparison if null
  });

  if (!validation.valid) {
    console.error('[Square OAuth Callback] Validation failed:', validation.error);
    return NextResponse.redirect(
      new URL(
        `/creator/payouts/setup?error=validation_failed&message=${encodeURIComponent(validation.error || 'Unknown error')}`,
        req.url
      )
    );
  }

  // Verify user is authenticated
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    console.error('[Square OAuth Callback] User not authenticated');
    return NextResponse.redirect(new URL('/login?redirect=/creator/payouts/setup', req.url));
  }

  try {
    console.warn('[Square OAuth Callback] Completing connection for user:', userId);

    // Exchange code for tokens and complete connection
    await paymentService.completeConnection(userId, code!);

    console.warn('[Square OAuth Callback] Connection successful for user:', userId);
    return NextResponse.redirect(new URL('/creator/payouts/setup?connected=true', req.url));
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Square OAuth Callback] Connection failed:', {
      userId,
      error: errorMessage,
    });
    return NextResponse.redirect(
      new URL(
        `/creator/payouts/setup?error=connection_failed&message=${encodeURIComponent(errorMessage)}`,
        req.url
      )
    );
  }
}
