
import { type NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin'; // Admin SDK
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'admin-session';
// Firebase session cookies can last up to 14 days.
const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken;

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    // This will now throw an error if initialization fails, which will be caught below.
    const adminAuth = getAdminAuth();
    
    // Verify the ID token
    const decodedIdToken = await adminAuth.verifyIdToken(idToken);
    
    // Check for admin custom claim before creating session cookie
    if (!decodedIdToken.admin) { // Ensure your custom claim is named 'admin'
      console.warn(`Admin access denied for UID: ${decodedIdToken.uid}. Missing 'admin' custom claim. Token claims:`, decodedIdToken);
      return NextResponse.json({ error: 'User is not an administrator. Access denied. Please ensure the admin custom claim (admin: true) is set for this user in Firebase Authentication.' }, { status: 403 });
    }

    // Create session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set cookie policy for session cookie.
    cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: expiresIn / 1000, // maxAge is in seconds
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('Session login error:', error);
    
    // Check if it's the specific initialization error from our new admin library
    if (error.message && error.message.includes('Firebase Admin SDK Error')) {
        return NextResponse.json({ error: 'Server not configured for authentication. Firebase Admin SDK initialization failed.' }, { status: 500 });
    }

    let errorMessage = 'Internal server error during session login.';
    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'ID token has expired. Please try logging in again.';
    } else if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-revoked') {
        errorMessage = 'Invalid ID token.';
    } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This admin account has been disabled.';
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }
}
