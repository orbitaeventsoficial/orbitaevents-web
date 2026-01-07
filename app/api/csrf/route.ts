import { NextRequest, NextResponse } from 'next/server';
import { getCsrfToken, setCsrfCookie } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = getCsrfToken(request);
  const response = NextResponse.json({ token });
  return setCsrfCookie(response, token);
}
