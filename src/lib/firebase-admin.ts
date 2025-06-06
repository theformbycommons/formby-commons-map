
import admin, { type App } from 'firebase-admin';

let app: App;

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('FIREBASE_ADMIN_PRIVATE_KEY environment variable is not set.');
  }
  // Replace \\n with \n to correctly parse the private key if it's stored as a single line string
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (!projectId || !clientEmail) {
    throw new Error('FIREBASE_ADMIN_PROJECT_ID or FIREBASE_ADMIN_CLIENT_EMAIL environment variables are not set.');
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: formattedPrivateKey,
    }),
  });
} else {
  app = admin.app();
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default app;
