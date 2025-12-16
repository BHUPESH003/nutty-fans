/**
 * Square API Types
 */

export interface SquareOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  merchant_id: string;
  refresh_token: string;
}

export interface SquareMerchant {
  id: string;
  business_name: string;
  country: string;
  status: string;
}

export interface SquarePayoutRequest {
  idempotency_key: string;
  payout: {
    destination: {
      type: 'BANK_ACCOUNT';
      bank_account_id: string;
    };
    location_id: string;
    amount_money: {
      amount: number; // In cents
      currency: string;
    };
  };
}

export interface SquareWebhookPayload {
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object: Record<string, unknown>;
  };
}
