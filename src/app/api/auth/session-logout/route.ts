
import { type NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'admin-session';

export async function POST(request: NextRequest) {
  // Logout/session revocation is not available in static export builds.
  console.warn('Session logout called in static export; no server session to revoke.');
  return NextResponse.json({ error: 'Not implemented in static export. Use a serverless admin endpoint for session management.' }, { status: 501 });
}
