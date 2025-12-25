/**
 * Shared error codes between frontend and backend
 * This ensures consistency in error handling across the application
 */

// Payment Errors
export const PAYMENT_INSUFFICIENT_BALANCE = 'PAYMENT_INSUFFICIENT_BALANCE';
export const PAYMENT_FAILED = 'PAYMENT_FAILED';
export const PAYMENT_PROCESSOR_ERROR = 'PAYMENT_PROCESSOR_ERROR';

// Authentication errors
export const AUTH_REQUIRED = 'AUTH_REQUIRED';
export const AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS';
export const AUTH_ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED';
export const AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED';
export const AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID';

// Validation Errors
export const VALIDATION_ERROR = 'VALIDATION_ERROR';
export const VALIDATION_MISSING_FIELD = 'VALIDATION_MISSING_FIELD';
export const VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT';

// Resource Errors
export const RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND';
export const RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS';
export const RESOURCE_UNAUTHORIZED = 'RESOURCE_UNAUTHORIZED';
export const RESOURCE_FORBIDDEN = 'RESOURCE_FORBIDDEN';

// General
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR';
export const INTERNAL_ERROR = 'INTERNAL_ERROR';
export const NETWORK_ERROR = 'NETWORK_ERROR';

/**
 * HTTP Status codes that map to error codes
 */
export const ERROR_STATUS_CODES = {
  [PAYMENT_INSUFFICIENT_BALANCE]: 402,
  [AUTH_REQUIRED]: 401,
  [AUTH_INVALID_CREDENTIALS]: 401,
  [AUTH_ACCOUNT_LOCKED]: 403,
  [AUTH_TOKEN_EXPIRED]: 401,
  [AUTH_TOKEN_INVALID]: 401,
  [RESOURCE_NOT_FOUND]: 404,
  [RESOURCE_ALREADY_EXISTS]: 409,
  [RESOURCE_UNAUTHORIZED]: 401,
  [RESOURCE_FORBIDDEN]: 403,
  [VALIDATION_ERROR]: 400,
  [VALIDATION_MISSING_FIELD]: 400,
  [VALIDATION_INVALID_FORMAT]: 400,
  [INTERNAL_ERROR]: 500,
  [UNKNOWN_ERROR]: 500,
  [NETWORK_ERROR]: 0,
} as const;

/**
 * Check if an error code indicates insufficient balance
 */
export function isInsufficientBalanceError(errorCode?: string): boolean {
  return errorCode === PAYMENT_INSUFFICIENT_BALANCE;
}

/**
 * Check if an HTTP status code indicates insufficient balance
 */
export function isInsufficientBalanceStatus(status: number): boolean {
  return status === 402;
}
