// scripts/set-admin.mjs
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Initializes the Firebase Admin SDK and returns the Auth instance.
 * Reads credentials from environment variables defined in .env.local.
 * This makes the script self-contained and avoids module resolution issues.
 */
function initializeAdminAuth() {
  // Return existing instance if already initialized
  if (getApps().length) {
    return getAuth();
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!privateKey || !projectId || !clientEmail) {
    console.error('CRITICAL: Missing Firebase Admin credentials in .env.local.');
    console.error('Please ensure FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY are set.');
    return null;
  }
  
  // The private key from a Secret Manager or .env file often has escaped newlines.
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const app = initializeApp({
      credential: cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
    return getAuth(app);
  } catch (error) {
    console.error("Firebase Admin SDK Initialization FAILED:", error);
    return null;
  }
}

const uid = process.argv[2];

if (!uid) {
  console.error('\nERROR: Please provide a User UID as an argument.');
  console.log('Usage: npm run set-admin <USER_UID>\n');
  process.exit(1);
}

const adminAuth = initializeAdminAuth();

if (!adminAuth) {
  console.error('\nAborting: Firebase Admin SDK failed to initialize. Check your .env.local file.\n');
  process.exit(1);
}

adminAuth.setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`\n✅ Successfully set admin claim for user: ${uid}`);
    return adminAuth.getUser(uid);
  })
  .then((userRecord) => {
    console.log('Updated user claims:', userRecord.customClaims);
    console.log('\nUser is now an administrator. They can log in at /admin/login\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error setting custom claim:', error.message);
     if (error.code === 'auth/user-not-found') {
        console.error(`\nHint: Make sure the UID "${uid}" is correct and the user exists in Firebase Authentication.`);
    }
    process.exit(1);
  });
