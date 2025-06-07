
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_SESSION_COOKIE_NAME = 'admin-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const allCookies = request.cookies.getAll();
  console.log(`Middleware triggered for path: ${pathname}`);
  console.log('Middleware received cookies:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 30) + (c.value.length > 30 ? '...' : '') }))); // Log only a snippet of cookie values

  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    console.log(`Accessing admin path: ${pathname}`);
    if (!sessionCookie) {
      console.log('Admin session cookie NOT found. Redirecting to /admin/login.');
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }

    console.log(`Admin session cookie FOUND for ${pathname}. Proceeding. TODO: Implement full verification.`);
    // --- TODO: Implement Full Session Verification & Admin Claim Check ---
    // For now, if a cookie exists, we are TEMPORARILY allowing access.
    return NextResponse.next();
  }

  if (pathname === '/admin/login') {
    console.log('Accessing /admin/login path.');
    if (sessionCookie) {
        // TODO: Verify session cookie here as well before redirecting.
        console.log('User already has session (cookie found on /admin/login), redirecting to /admin/suggestions');
        return NextResponse.redirect(new URL('/admin/suggestions', request.url));
    }
    console.log('No admin session cookie on /admin/login. Allowing access.');
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
