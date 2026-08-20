
import { type NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'admin-session';
// Firebase session cookies can last up to 14 days.
const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds

export async function POST(request: NextRequest) {
  // Server-side session cookie creation is not available in the static export.
  // Keep this route as a stub to make failures explicit at runtime.
  console.warn('Session login route called in static export build; admin session handling is disabled.');
  return NextResponse.json({ error: 'Not implemented in static export. Configure a serverless admin endpoint to handle session login.' }, { status: 501 });
}
