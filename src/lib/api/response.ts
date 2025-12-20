import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  code: number;
  data: T | null;
  message: string;
}

/**
 * Creates a standardized success response.
 * @param data The payload data.
 * @param message Optional success message.
 * @param code HTTP status code (default 200).
 */
export function successResponse<T>(data: T, message: string = 'Success', code: number = 200) {
  return NextResponse.json(
    {
      code,
      data,
      message,
    },
    { status: code }
  );
}

/**
 * Creates a standardized error response.
 * @param message Error message.
 * @param code HTTP status code (default 500).
 * @param data Optional error details.
 */
export function errorResponse(
  message: string = 'Internal Server Error',
  code: number = 500,
  data: unknown = null
) {
  return NextResponse.json(
    {
      code,
      data,
      message,
    },
    { status: code }
  );
}
