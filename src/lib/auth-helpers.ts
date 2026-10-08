// src/lib/auth-helpers.ts
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

/**
 * Check if user is admin by their custom claims
 * (NOT by hardcoded UID)
 */
export async function isUserAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  
  const idTokenResult = await user.getIdTokenResult();
  return idTokenResult.claims.admin === true;
}

/**
 * Force refresh user claims (call after admin is set)
 */
export async function refreshAdminClaims(user: User | null): Promise<boolean> {
  if (!user) return false;
  
  await user.getIdTokenResult(true); // Force refresh
  return isUserAdmin(user);
}
