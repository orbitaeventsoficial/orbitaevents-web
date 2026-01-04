/**
 * API Response Utilities
 * Standardized response formats for API routes
 */

import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code && { code }),
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const ApiErrors = {
  badRequest: (message: string, details?: unknown) =>
    errorResponse(message, 400, 'BAD_REQUEST', details),

  unauthorized: (message: string = 'Unauthorized') =>
    errorResponse(message, 401, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Forbidden') =>
    errorResponse(message, 403, 'FORBIDDEN'),

  notFound: (message: string = 'Not found') =>
    errorResponse(message, 404, 'NOT_FOUND'),

  conflict: (message: string, details?: unknown) =>
    errorResponse(message, 409, 'CONFLICT', details),

  unprocessable: (message: string, details?: unknown) =>
    errorResponse(message, 422, 'UNPROCESSABLE_ENTITY', details),

  tooManyRequests: (message: string = 'Too many requests') =>
    errorResponse(message, 429, 'RATE_LIMIT_EXCEEDED'),

  internal: (message: string = 'Internal server error') =>
    errorResponse(message, 500, 'INTERNAL_ERROR'),

  serviceUnavailable: (message: string = 'Service unavailable') =>
    errorResponse(message, 503, 'SERVICE_UNAVAILABLE'),
};
