/**
 * Square OAuth URL Builder
 *
 * A dedicated, secure OAuth URL builder for Square OAuth flow.
 * Supports both sandbox and production environments.
 */

import crypto from 'crypto';

// Environment configuration
const SQUARE_ENVIRONMENTS = {
  sandbox: 'https://connect.squareupsandbox.com',
  production: 'https://connect.squareup.com',
} as const;

type SquareEnvironment = keyof typeof SQUARE_ENVIRONMENTS;

export interface SquareOAuthParams {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  environment: SquareEnvironment;
}

export interface SquareOAuthResult {
  url: string;
  state: string;
  environment: SquareEnvironment;
  redirectUri: string;
  scopes: string[];
}

/**
 * Generate a cryptographically secure state token for CSRF protection
 */
export function generateSecureState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Build Square OAuth authorization URL
 *
 * @throws Error if required parameters are missing
 */
export function buildSquareAuthorizeUrl(params: SquareOAuthParams): SquareOAuthResult {
  // Validate required parameters
  if (!params.clientId) {
    throw new Error('Square OAuth: clientId is required');
  }
  if (!params.redirectUri) {
    throw new Error('Square OAuth: redirectUri is required');
  }
  if (!params.scopes || params.scopes.length === 0) {
    throw new Error('Square OAuth: at least one scope is required');
  }
  if (!params.state) {
    throw new Error('Square OAuth: state is required for CSRF protection');
  }
  if (!params.environment) {
    throw new Error('Square OAuth: environment must be specified');
  }

  const baseUrl = SQUARE_ENVIRONMENTS[params.environment];
  if (!baseUrl) {
    throw new Error(`Square OAuth: invalid environment "${params.environment}"`);
  }

  // Build URL with URLSearchParams for proper encoding
  const searchParams = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: params.scopes.join(' '), // Space-separated scopes
    session: 'false', // Required for production apps
    state: params.state,
  });

  const url = `${baseUrl}/oauth2/authorize?${searchParams.toString()}`;

  // Log for debugging (excluding secrets)
  console.warn('[Square OAuth] Building authorization URL:', {
    environment: params.environment,
    baseUrl,
    redirectUri: params.redirectUri,
    scopes: params.scopes,
    stateLength: params.state.length,
    fullUrl: url,
  });

  return {
    url,
    state: params.state,
    environment: params.environment,
    redirectUri: params.redirectUri,
    scopes: params.scopes,
  };
}

/**
 * Validate OAuth callback parameters
 */
export function validateOAuthCallback(params: {
  code?: string | null;
  state?: string | null;
  error?: string | null;
  storedState?: string | null;
}): { valid: boolean; error?: string } {
  if (params.error) {
    console.error('[Square OAuth] Authorization denied:', params.error);
    return { valid: false, error: `Authorization denied: ${params.error}` };
  }

  if (!params.code) {
    console.error('[Square OAuth] Missing authorization code');
    return { valid: false, error: 'Missing authorization code' };
  }

  if (!params.state) {
    console.error('[Square OAuth] Missing state parameter');
    return { valid: false, error: 'Missing state parameter' };
  }

  if (params.storedState && params.state !== params.storedState) {
    console.error('[Square OAuth] State mismatch - possible CSRF attack', {
      received: params.state.substring(0, 10) + '...',
      expected: params.storedState.substring(0, 10) + '...',
    });
    return { valid: false, error: 'State mismatch - invalid request' };
  }

  return { valid: true };
}

/**
 * Get Square OAuth configuration from environment
 */
export function getSquareOAuthConfig(): {
  clientId: string;
  clientSecret: string;
  environment: SquareEnvironment;
  redirectUri: string;
  scopes: string[];
} {
  const environment = (
    process.env['SQUARE_ENVIRONMENT'] === 'production' ? 'production' : 'sandbox'
  ) as SquareEnvironment;

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/creator/square/callback`;

  return {
    clientId: process.env['SQUARE_APPLICATION_ID'] ?? '',
    clientSecret: process.env['SQUARE_APPLICATION_SECRET'] ?? '',
    environment,
    redirectUri,
    // Minimal scopes for testing - BANK_ACCOUNTS_READ may require special approval
    scopes: ['MERCHANT_PROFILE_READ', 'PAYMENTS_WRITE'],
  };
}
