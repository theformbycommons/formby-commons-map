
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, signInAnonymously, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
// Storage initialization was removed as per user request to phase out storage.

// --- Enhanced Debugging ---
console.log("--- Firebase Client Initialization (src/lib/firebase.ts) ---");
const nodeEnv = process.env.NODE_ENV;
console.log(`Current NODE_ENV: ${nodeEnv}`);

if (typeof window !== 'undefined' && nodeEnv === 'development') {
  console.warn("IMPORTANT: Running in local development. Firebase config below should be loaded from '.env.local' in your project root.");
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log("--- Firebase Client Config Values Being Used (src/lib/firebase.ts) ---");
console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", firebaseConfig.apiKey ? `SET (Value starts with: ${firebaseConfig.apiKey.substring(0, Math.min(5, firebaseConfig.apiKey.length))}...)` : "NOT SET - THIS IS THE LIKELY CAUSE OF 'auth/invalid-api-key'!");
console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", firebaseConfig.authDomain ? `SET (Value: ${firebaseConfig.authDomain})` : "NOT SET");
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", firebaseConfig.projectId ? `SET (Value: ${firebaseConfig.projectId})` : "NOT SET");
console.log("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", firebaseConfig.storageBucket ? `SET (Value: ${firebaseConfig.storageBucket})` : "NOT SET (Note: Storage SDK init removed)");
console.log("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", firebaseConfig.messagingSenderId ? `SET (Value: ${firebaseConfig.messagingSenderId})` : "NOT SET");
console.log("NEXT_PUBLIC_FIREBASE_APP_ID:", firebaseConfig.appId ? `SET (Value: ${firebaseConfig.appId})` : "NOT SET");
console.log("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:", firebaseConfig.measurementId ? `SET (Optional - Value: ${firebaseConfig.measurementId})` : "NOT SET (Optional)");
console.log("--- End Firebase Client Config Values ---");


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// **Critical check for API Key before initialization**
if (!firebaseConfig.apiKey) {
  const errorMessage = `
    CRITICAL ERROR: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing!
    Firebase cannot be initialized.

    Please ensure:
    1. You have a '.env.local' file in the ROOT of your project.
    2. This '.env.local' file contains the line: NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_ACTUAL_API_KEY_HERE"
       (Replace with your actual key from apphosting.production.yaml or Firebase console).
    3. You have RESTARTED your Next.js development server (e.g., 'npm run dev') after creating or modifying '.env.local'.

    The application will not work until this is resolved.
  `;
  console.error(errorMessage);
  // This error will be thrown and should be visible in the browser and server console
  // It will stop execution before Firebase tries to initialize with a bad key.
  throw new Error(errorMessage); 
}

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db, signInAnonymously, onAuthStateChanged, type FirebaseUser };
