import { NextRequest, NextResponse } from 'next/server';

const UMAMI_URL = 'https://cloud.umami.is/api/send';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Get real client IP from various headers
    const clientIp =
      request.headers.get('cf-connecting-ip') ||  // Cloudflare
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    // Forward the request to Umami with the real client IP
    const response = await fetch(UMAMI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': clientIp,
        'X-Real-IP': clientIp,
      },
      body,
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Umami Proxy] Error:', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
