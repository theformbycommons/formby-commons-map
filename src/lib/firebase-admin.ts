
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

// This flag prevents re-running initialization logic in a serverless environment
// where the module might be cached.
let initializationAttempted = false;

function initializeAdminSdk() {
  if (app || initializationAttempted) {
    return;
  }
  initializationAttempted = true;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  // Detailed checks for each environment variable
  if (!projectId) {
    console.error("Firebase Admin Init Error: FIREBASE_ADMIN_PROJECT_ID environment variable is not set.");
  }
  if (!clientEmail) {
    console.error("Firebase Admin Init Error: FIREBASE_ADMIN_CLIENT_EMAIL environment variable is not set.");
  }
  if (!privateKey) {
    console.error("Firebase Admin Init Error: FIREBASE_ADMIN_PRIVATE_KEY is not set. This value should be sourced from your project's service account or a secret manager.");
  }

  if (!projectId || !clientEmail || !privateKey) {
    console.error("CRITICAL: Cannot initialize Firebase Admin SDK due to missing credentials. Admin features will be non-functional.");
    return;
  }

  // The private key from an environment variable needs to have its newlines restored.
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });
    }

    adminAuthInstance = getAuth(app);
    adminDbInstance = getFirestore(app);
    console.log("Firebase Admin SDK has been successfully initialized.");

  } catch (error: any) {
    console.error(">>> Firebase Admin SDK Initialization FAILED <<<");
    console.error("Error Details:", error.message);
    // Log the stack for more detailed debugging if available
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run initialization when the module is first loaded.
initializeAdminSdk();

export function getAdminAuth(): Auth | null {
  return adminAuthInstance;
}

export function getAdminDb(): Firestore | null {
  return adminDbInstance;
}
