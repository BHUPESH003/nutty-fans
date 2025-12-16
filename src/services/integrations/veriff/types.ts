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
