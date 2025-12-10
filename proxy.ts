import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export default function proxy(_req: NextRequest) {
  const res = NextResponse.next();

  if (process.env.NODE_ENV === 'production') {
    res.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vitals.vercel-insights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; media-src 'self' https:; worker-src 'self' blob:; frame-src 'self'"
    );
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
