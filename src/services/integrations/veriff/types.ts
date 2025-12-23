/**
 * Veriff API Types
 */

export interface VeriffSessionRequest {
  verification: {
    callback: string;
    person: {
      firstName?: string;
      lastName?: string;
      idNumber?: string;
    };
    vendorData: string;
  };
}

export interface VeriffSessionResponse {
  status: string;
  verification: {
    id: string;
    url: string;
    vendorData: string;
    host: string;
    status: string;
    sessionToken: string;
  };
}

export interface VeriffWebhookPayload {
  id: string;
  attemptId: string;
  feature: string;
  code: number;
  action:
    | 'submitted'
    | 'resubmission_requested'
    | 'approved'
    | 'declined'
    | 'expired'
    | 'abandoned';
  vendorData: string;
  technicalData?: {
    ip?: string;
  };
  verification?: {
    id: string;
    status: string;
    reason?: string;
    reasonCode?: number;
    person?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      nationality?: string;
    };
    document?: {
      type?: string;
      country?: string;
      number?: string;
    };
  };
}

export type VeriffDecisionStatus =
  | 'approved'
  | 'declined'
  | 'resubmission_requested'
  | 'expired'
  | 'abandoned';

/**
 * Response from Veriff session status endpoint
 * GET /v1/sessions/{sessionId}/decision
 */
export interface VeriffSessionDecisionResponse {
  status: string;
  verification: {
    id: string;
    code: number;
    status:
      | 'approved'
      | 'declined'
      | 'resubmission_requested'
      | 'expired'
      | 'abandoned'
      | 'submitted'
      | 'started'
      | 'created';
    reason?: string | null;
    reasonCode?: number | null;
    person?: {
      firstName?: string | null;
      lastName?: string | null;
      dateOfBirth?: string | null;
    } | null;
    document?: {
      type?: string | null;
      country?: string | null;
      number?: string | null;
    } | null;
    vendorData?: string | null;
  };
}
