
'use server';

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

function initializeAdmin() {
  // This function is now idempotent, it will only initialize the app once.
  if (app) {
    return;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('SERVER-SIDE ERROR: The FIREBASE_ADMIN_PRIVATE_KEY environment variable is not set. This is required for admin actions (like voting, suggesting, approving). Please ensure it is set in your local .env.local file or server environment.');
  }
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (!projectId || !clientEmail) {
    throw new Error('SERVER-SIDE ERROR: FIREBASE_ADMIN_PROJECT_ID or FIREBASE_ADMIN_CLIENT_EMAIL environment variables are not set.');
  }

  const existingApps = getApps();
  if (existingApps.length) {
    app = existingApps[0];
  } else {
    app = initializeApp({
      credential: cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
  }

  adminAuthInstance = getAuth(app);
  adminDbInstance = getFirestore(app);
}

export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    initializeAdmin();
  }
  return adminAuthInstance!;
}

export function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    initializeAdmin();
  }
  return adminDbInstance!;
}
