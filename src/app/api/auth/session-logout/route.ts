
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
// import { adminAuth } from '@/lib/firebase-admin'; // For revoking session if needed

const SESSION_COOKIE_NAME = 'admin-session';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;

    if (sessionCookie) {
      // If using Firebase Admin SDK to manage sessions actively, you might revoke it:
      // const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true).catch(() => null);
      // if (decodedClaims) {
      //   await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      // }
    }

    // Clear the session cookie
    cookies().set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Expire immediately
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ status: 'success', message: 'Logged out successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Session logout error:', error);
    return NextResponse.json({ error: 'Internal server error during logout.' }, { status: 500 });
  }
}
