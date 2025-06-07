
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`SIMPLE MIDDLEWARE TRIGGERED for path: ${pathname}`);

  // For now, just allow all requests through to see if it logs
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Let's also explicitly add /api/auth/session-login to see if it's caught,
    // though middleware usually doesn't run for API routes by default unless configured.
    // '/api/auth/session-login'
  ],
};
