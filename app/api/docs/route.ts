/**
 * API Documentation Endpoint
 * Returns OpenAPI 3.1 specification
 *
 * @route GET /api/docs
 * @returns OpenAPI JSON specification
 */

import { NextResponse } from 'next/server';
import { openAPISchema } from '@/lib/api/openapi';

export const dynamic = 'force-static';

/**
 * GET /api/docs
 * Returns the OpenAPI specification for the API
 */
export async function GET() {
  return NextResponse.json(openAPISchema, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
