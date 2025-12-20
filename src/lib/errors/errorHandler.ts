import { NextResponse } from 'next/server';

// Authentication errors (1000-1099)
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

// Payment Errors
export const PAYMENT_INSUFFICIENT_BALANCE = 'PAYMENT_INSUFFICIENT_BALANCE';

// General
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR';
export const INTERNAL_ERROR = 'INTERNAL_ERROR'; // Added this based on usage in createErrorResponse

// Define ErrorCode type
export type ErrorCode =
  | typeof AUTH_REQUIRED
  | typeof AUTH_INVALID_CREDENTIALS
  | typeof AUTH_ACCOUNT_LOCKED
  | typeof AUTH_TOKEN_EXPIRED
  | typeof AUTH_TOKEN_INVALID
  | typeof VALIDATION_ERROR
  | typeof VALIDATION_MISSING_FIELD
  | typeof VALIDATION_INVALID_FORMAT
  | typeof RESOURCE_NOT_FOUND
  | typeof RESOURCE_ALREADY_EXISTS
  | typeof RESOURCE_UNAUTHORIZED
  | typeof RESOURCE_FORBIDDEN
  | typeof PAYMENT_INSUFFICIENT_BALANCE
  | typeof UNKNOWN_ERROR
  | typeof INTERNAL_ERROR;

// Export a list of all error codes
export const ALL_ERROR_CODES: ErrorCode[] = [
  AUTH_REQUIRED,
  AUTH_INVALID_CREDENTIALS,
  AUTH_ACCOUNT_LOCKED,
  AUTH_TOKEN_EXPIRED,
  AUTH_TOKEN_INVALID,
  VALIDATION_ERROR,
  VALIDATION_MISSING_FIELD,
  VALIDATION_INVALID_FORMAT,
  RESOURCE_NOT_FOUND,
  RESOURCE_ALREADY_EXISTS,
  RESOURCE_UNAUTHORIZED,
  RESOURCE_FORBIDDEN,
  PAYMENT_INSUFFICIENT_BALANCE,
  UNKNOWN_ERROR,
  INTERNAL_ERROR,
];

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

export class AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function createErrorResponse(error: unknown): NextResponse {
  // Handle AppError instances
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        code: error.statusCode,
        data: {
          errorCode: error.code,
          details: error.details,
        },
        message: error.message,
      },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };

    if (prismaError.code === 'P2002') {
      // Unique constraint violation
      return NextResponse.json(
        {
          code: 409,
          data: {
            errorCode: RESOURCE_ALREADY_EXISTS,
            details: prismaError.meta,
          },
          message: 'A resource with this value already exists',
        },
        { status: 409 }
      );
    }

    if (prismaError.code === 'P2025') {
      // Record not found
      return NextResponse.json(
        {
          code: 404,
          data: {
            errorCode: RESOURCE_NOT_FOUND,
            details: prismaError.meta,
          },
          message: 'Resource not found',
        },
        { status: 404 }
      );
    }
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Check for known error messages
    if (error.message.includes('Unauthorized') || error.message.includes('unauthorized')) {
      return NextResponse.json(
        {
          code: 401,
          data: { errorCode: RESOURCE_UNAUTHORIZED },
          message: 'Unauthorized access',
        },
        { status: 401 }
      );
    }

    if (error.message.includes('Forbidden') || error.message.includes('forbidden')) {
      return NextResponse.json(
        {
          code: 403,
          data: { errorCode: RESOURCE_FORBIDDEN },
          message: 'Access forbidden',
        },
        { status: 403 }
      );
    }

    if (error.message.includes('Not found') || error.message.includes('not found')) {
      return NextResponse.json(
        {
          code: 404,
          data: { errorCode: RESOURCE_NOT_FOUND },
          message: error.message,
        },
        { status: 404 }
      );
    }

    if (error.message.includes('Insufficient balance')) {
      return NextResponse.json(
        {
          code: 402,
          data: { errorCode: PAYMENT_INSUFFICIENT_BALANCE },
          message: 'Insufficient balance. Please add funds to continue.',
        },
        { status: 402 }
      );
    }
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  // Default error response
  return NextResponse.json(
    {
      code: 500,
      data: { errorCode: INTERNAL_ERROR },
      message: 'An unexpected error occurred. Please try again later.',
    },
    { status: 500 }
  );
}

export function handleAsyncRoute(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  return handler().catch((error) => {
    return createErrorResponse(error);
  });
}
