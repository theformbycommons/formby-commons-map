
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;
let initializationError: Error | null = null;

function initializeAdminSdk() {
  // Only run initialization if there are no apps initialized yet.
  if (getApps().length > 0) {
    const existingApp = getApps()[0];
    adminAuthInstance = getAuth(existingApp);
    adminDbInstance = getFirestore(existingApp);
    return;
  }

  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("One or more required Firebase Admin environment variables (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) are missing.");
    }
    
    // The private key from an environment variable needs to have its newlines restored.
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });

    adminAuthInstance = getAuth(app);
    adminDbInstance = getFirestore(app);
    console.log("Firebase Admin SDK has been successfully initialized on demand.");
  
  } catch (error: any) {
    initializationError = error; // Store the error
    console.error(">>> CRITICAL: Firebase Admin SDK Initialization FAILED <<<");
    console.error("Error Details:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    // Ensure instances are null if initialization fails
    adminAuthInstance = null;
    adminDbInstance = null;
  }
}

// Call initialization immediately
initializeAdminSdk();

export function getAdminAuth(): Auth | null {
  if (initializationError) {
    // If initialization failed previously, don't re-attempt, just return null.
    return null;
  }
  return adminAuthInstance;
}

export function getAdminDb(): Firestore | null {
  if (initializationError) {
    // If initialization failed previously, don't re-attempt, just return null.
    return null;
  }
  return adminDbInstance;
}
