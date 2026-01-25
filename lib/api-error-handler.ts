/**
 * Standardized API Error Handler
 *
 * Provides consistent error handling across all API routes with:
 * - Structured error logging
 * - User-friendly error messages
 * - Error codes for client-side handling
 * - Stack traces in development
 */

import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

// Error codes for client-side handling
export enum ApiErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Conflict errors (409)
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

interface ApiErrorResponse {
  error: string;
  code: ApiErrorCode;
  message?: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

interface ErrorHandlerOptions {
  context: string; // What was being done when the error occurred
  userMessage?: string; // Custom user-facing message
  includeDetails?: boolean; // Include error details in response
  statusCode?: number; // Override auto-detected status code
  metadata?: Record<string, unknown>; // Additional context for logging
}

/**
 * Main error handler function
 * Automatically detects error type and returns appropriate response
 */
export function handleApiError(
  error: unknown,
  options: ErrorHandlerOptions
): NextResponse<ApiErrorResponse> {
  const {
    context,
    userMessage,
    includeDetails = process.env.NODE_ENV === 'development',
    statusCode,
    metadata = {},
  } = options;

  const timestamp = new Date().toISOString();

  // Detect error type and get appropriate response
  const errorInfo = detectErrorType(error);

  // Log error with full context
  log.error(context, error, {
    context: {
      code: errorInfo.code,
      statusCode: statusCode || errorInfo.statusCode,
      ...metadata,
      timestamp,
      stack: error instanceof Error ? error.stack : undefined,
    },
  });

  // Build response
  const response: ApiErrorResponse = {
    error: userMessage || errorInfo.userMessage,
    code: errorInfo.code,
    timestamp,
  };

  // Add details in development
  if (includeDetails && error instanceof Error) {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5), // First 5 lines only
    };
  }

  return NextResponse.json(response, {
    status: statusCode || errorInfo.statusCode,
  });
}

/**
 * Detect error type and return appropriate code/message/status
 */
function detectErrorType(error: unknown): {
  code: ApiErrorCode;
  userMessage: string;
  statusCode: number;
} {
  // Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    return {
      code: ApiErrorCode.VALIDATION_ERROR,
      userMessage: `Error de validación: ${firstError.message}`,
      statusCode: 400,
    };
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return {
          code: ApiErrorCode.DUPLICATE_ENTRY,
          userMessage: 'Este registro ya existe en el sistema',
          statusCode: 409,
        };

      case 'P2025': // Record not found
        return {
          code: ApiErrorCode.NOT_FOUND,
          userMessage: 'El recurso solicitado no fue encontrado',
          statusCode: 404,
        };

      case 'P2003': // Foreign key constraint
        return {
          code: ApiErrorCode.VALIDATION_ERROR,
          userMessage: 'No se puede completar la operación debido a relaciones de datos',
          statusCode: 400,
        };

      default:
        return {
          code: ApiErrorCode.DATABASE_ERROR,
          userMessage: 'Error en la base de datos',
          statusCode: 500,
        };
    }
  }

  // Prisma connection errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      code: ApiErrorCode.DATABASE_ERROR,
      userMessage: 'No se puede conectar a la base de datos',
      statusCode: 503,
    };
  }

  // Network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: ApiErrorCode.EXTERNAL_SERVICE_ERROR,
      userMessage: 'Error al conectar con servicio externo',
      statusCode: 502,
    };
  }

  // Standard errors with specific messages
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('not authenticated')) {
      return {
        code: ApiErrorCode.UNAUTHORIZED,
        userMessage: 'No estás autenticado. Por favor, inicia sesión',
        statusCode: 401,
      };
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return {
        code: ApiErrorCode.FORBIDDEN,
        userMessage: 'No tienes permisos para realizar esta acción',
        statusCode: 403,
      };
    }

    if (message.includes('not found')) {
      return {
        code: ApiErrorCode.NOT_FOUND,
        userMessage: 'Recurso no encontrado',
        statusCode: 404,
      };
    }

    if (message.includes('rate limit')) {
      return {
        code: ApiErrorCode.RATE_LIMIT_EXCEEDED,
        userMessage: 'Demasiadas solicitudes. Por favor, intenta más tarde',
        statusCode: 429,
      };
    }
  }

  // Default fallback
  return {
    code: ApiErrorCode.INTERNAL_ERROR,
    userMessage: 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo',
    statusCode: 500,
  };
}

/**
 * Validation error helper
 * Use for immediate validation errors
 */
export function validationError(
  message: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  log.warn('Validation error', { message, details });

  return NextResponse.json(
    {
      error: message,
      code: ApiErrorCode.VALIDATION_ERROR,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

/**
 * Not found error helper
 */
export function notFoundError(
  resource: string = 'Recurso'
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: `${resource} no encontrado`,
      code: ApiErrorCode.NOT_FOUND,
      timestamp: new Date().toISOString(),
    },
    { status: 404 }
  );
}

/**
 * Unauthorized error helper
 */
export function unauthorizedError(
  message: string = 'No autorizado'
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      code: ApiErrorCode.UNAUTHORIZED,
      timestamp: new Date().toISOString(),
    },
    { status: 401 }
  );
}

/**
 * Rate limit error helper
 */
export function rateLimitError(
  retryAfter?: number
): NextResponse<ApiErrorResponse> {
  const response = NextResponse.json(
    {
      error: 'Demasiadas solicitudes. Por favor, intenta más tarde',
      code: ApiErrorCode.RATE_LIMIT_EXCEEDED,
      message: retryAfter
        ? `Intenta de nuevo en ${retryAfter} segundos`
        : undefined,
      timestamp: new Date().toISOString(),
    },
    { status: 429 }
  );

  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}
