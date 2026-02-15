import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

export function getRequestId(req: NextRequest): string {
  const forwarded = req.headers.get('x-request-id')?.trim();
  return forwarded && forwarded.length > 0 ? forwarded : randomUUID();
}

