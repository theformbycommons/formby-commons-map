
'use server';

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;
let initFailed = false; // Flag to prevent re-attempts

function initializeAdmin(): boolean {
  if (app) return true; // Already initialized successfully
  if (initFailed) return false; // Don't re-attempt a failed initialization

  console.log("--- Firebase Admin SDK Initialization Attempt ---");

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  // Log status of each variable
  console.log("Verifying FIREBASE_ADMIN_PROJECT_ID:", projectId ? "Found" : "MISSING");
  console.log("Verifying FIREBASE_ADMIN_CLIENT_EMAIL:", clientEmail ? "Found" : "MISSING");
  console.log("Verifying FIREBASE_ADMIN_PRIVATE_KEY:", privateKey ? "Found" : "MISSING");

  if (!privateKey || !projectId || !clientEmail) {
    console.error('SERVER-SIDE CONFIG ERROR: One or more required Firebase Admin environment variables are not set in your .env.local file. Admin actions will fail.');
    initFailed = true;
    return false;
  }
  
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

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
    console.log("--- Firebase Admin SDK Initialization SUCCESSFUL ---");
    return true; // Success
  } catch (error) {
    console.error("--- Firebase Admin SDK Initialization FAILED ---", error);
    initFailed = true;
    return false; // Failure
  }
}

export function getAdminAuth(): Auth | null {
  if (!adminAuthInstance) {
    initializeAdmin();
  }
  return adminAuthInstance;
}

export function getAdminDb(): Firestore | null {
  if (!adminDbInstance) {
    initializeAdmin();
  }
  return adminDbInstance;
}
