
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;
let initFailed = false; // Add a flag to prevent re-attempts

function initializeAdmin(): boolean {
  if (app) return true; // Already initialized successfully
  if (initFailed) return false; // Don't re-attempt a failed initialization

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    console.error('SERVER-SIDE CONFIG ERROR: The FIREBASE_ADMIN_PRIVATE_KEY environment variable is not set. Admin actions will fail.');
    initFailed = true;
    return false;
  }
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (!projectId || !clientEmail) {
    console.error('SERVER-SIDE CONFIG ERROR: FIREBASE_ADMIN_PROJECT_ID or FIREBASE_ADMIN_CLIENT_EMAIL environment variables are not set. Admin actions will fail.');
    initFailed = true;
    return false;
  }

  try {
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
    return true; // Success
  } catch (error) {
    console.error("Firebase Admin SDK initialization failed:", error);
    initFailed = true;
    return false; // Failure
  }
}

export function getAdminAuth(): Auth | null {
  if (!adminAuthInstance && !initializeAdmin()) {
    return null;
  }
  return adminAuthInstance;
}

export function getAdminDb(): Firestore | null {
  if (!adminDbInstance && !initializeAdmin()) {
    return null;
  }
  return adminDbInstance;
}
