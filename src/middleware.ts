
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_SESSION_COOKIE_NAME = 'admin-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      // No session cookie, redirect to admin login page
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // --- TODO: Implement Full Session Verification & Admin Claim Check ---
    // At this point, we have a session cookie. The next step is to verify it
    // using the Firebase Admin SDK and check for an 'admin: true' custom claim.
    // This typically involves:
    // 1. Creating an API route (e.g., /api/auth/verify-session) that takes the
    //    sessionCookie value.
    // 2. This API route uses `adminAuth.verifySessionCookie(sessionCookie, true)`
    //    to check its validity and decode it.
    // 3. It then checks if `decodedClaims.admin === true`.
    // 4. The API route returns a JSON response indicating if the user is
    //    a_ A) authenticated and b) an admin.
    // 5. The middleware calls this API route. Based on the response:
    //    - If verified admin: return NextResponse.next();
    //    - If not verified or not admin: redirect to login or an unauthorized page.
    //
    // For now, for this iteration, if a cookie exists, we are TEMPORARILY allowing access.
    // This is NOT secure for production and needs to be completed.
    console.log(`Admin route accessed: ${pathname}. Session cookie found. TODO: Implement full verification.`);
    return NextResponse.next();
  }

  if (pathname === '/admin/login') {
    // If user is already logged in (has a session cookie) and tries to access login page,
    // redirect them to the admin dashboard.
    // This also needs the verification step to be fully robust.
    const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (sessionCookie) {
        // TODO: Verify session cookie here as well before redirecting.
        // For now, if cookie exists, assume logged in.
        console.log('User already has session, redirecting from /admin/login to /admin/suggestions');
        return NextResponse.redirect(new URL('/admin/suggestions', request.url));
    }
  }

  // For all other routes, or if already on /admin/login without a cookie, proceed as normal
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*', // Protects all routes under /admin
    // Ensure /admin/login is handled correctly (either by allowing or redirecting if already logged in)
  ],
};
