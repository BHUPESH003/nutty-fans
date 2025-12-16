export type AccountState = 'email_unverified' | 'age_pending' | 'age_denied' | 'active' | 'locked';

export type AgeVerificationStatus = 'pending' | 'passed' | 'failed' | 'needs_review' | null;

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  username?: string;
  role?: string;
  accountState?: AccountState;
  ageStatus?: AgeVerificationStatus;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  username?: string;
  dateOfBirth: string;
  country: string;
  acceptTerms: boolean;
}

export interface RegisterResponse {
  user: AuthUser;
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  accountState?: AccountState;
  error?: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface SimpleMessageResponse {
  message: string;
}
