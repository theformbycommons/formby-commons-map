
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
// Firebase Storage admin SDK (adminStorage) import and initialization removed.

let app: App;
const existingApps = getApps();

if (!existingApps.length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('FIREBASE_ADMIN_PRIVATE_KEY environment variable is not set.');
  }
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (!projectId || !clientEmail) {
    throw new Error('FIREBASE_ADMIN_PROJECT_ID or FIREBASE_ADMIN_CLIENT_EMAIL environment variables are not set.');
  }

  app = initializeApp({
    credential: cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: formattedPrivateKey,
    }),
    // storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET // Removed, not needed if adminStorage is not used
  });
} else {
  app = existingApps[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
// export const adminStorage = getStorage(app); // adminStorage export removed
export default app;
