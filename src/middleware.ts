
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the request is for an admin route
  if (pathname.startsWith('/admin')) {
    console.log(`Admin route accessed: ${pathname}. Full authentication and authorization checks should be implemented here.`);

    // --- TODO: Implement Actual Authentication & Authorization ---
    //
    // The following is a conceptual outline. Actual implementation will require
    // setting up Firebase Admin SDK (ideally in a backend or API route callable
    // by the middleware due to Edge runtime constraints) and a secure way to
    // handle admin login and ID token retrieval (e.g., HttpOnly cookies).

    // 1. Get the Firebase ID token:
    //    - This token would typically be stored in an HttpOnly cookie after
    //      an admin successfully logs in via a dedicated admin login page.
    //    const token = request.cookies.get('firebaseIdToken')?.value;
    //
    //    if (!token) {
    //      // No token found, redirect to admin login page
    //      const loginUrl = new URL('/admin-login', request.url); // Replace with your actual admin login page
    //      loginUrl.searchParams.set('redirectedFrom', pathname);
    //      return NextResponse.redirect(loginUrl);
    //    }

    // 2. Verify the ID token and check for admin custom claims:
    //    - This step usually involves the Firebase Admin SDK. Due to middleware
    //      Edge runtime limitations, you might call an internal API route
    //      that uses the Admin SDK for verification, or use a library compatible
    //      with Edge for JWT verification if you can get Firebase's public keys.
    //
    //    try {
    //      // Conceptual: verifyIdTokenAndCheckAdminClaim would be your function
    //      // that verifies the token and checks for { admin: true } claim.
    //      // const { isAdmin } = await verifyIdTokenAndCheckAdminClaim(token);
    //      //
    //      // if (!isAdmin) {
    //      //   // User is authenticated but not an admin
    //      //   const unauthorizedUrl = new URL('/unauthorized', request.url); // Replace with your unauthorized page
    //      //   return NextResponse.redirect(unauthorizedUrl);
    //      // }
    //      // If isAdmin is true, proceed to the admin route by returning NextResponse.next() below.
    //    } catch (error) {
    //      // Token verification failed (e.g., expired, invalid)
    //      // console.error('Admin auth error:', error);
    //      // const loginUrl = new URL('/admin-login', request.url);
    //      // loginUrl.searchParams.set('error', 'auth_failed');
    //      // return NextResponse.redirect(loginUrl);
    //    }

    // For now, allowing access as actual auth is not implemented.
    // In a real implementation, this NextResponse.next() would only be called
    // if the user is authenticated and authorized as an admin.
    return NextResponse.next();
  }

  // For all other routes, proceed as normal
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Other static assets in /public like images, fonts, etc.
     *
     * This ensures middleware primarily targets page routes.
     * You MUST include /admin paths here if you want them processed by middleware.
     */
    '/admin/:path*', // Protects all routes under /admin
    // Example for protecting multiple top-level paths:
    // '/dashboard/:path*',
    // '/settings/:path*',

    // To run middleware on almost all paths while excluding assets,
    // a more complex regex like the one below might be used, but start simple.
    // '/((?!api|_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
