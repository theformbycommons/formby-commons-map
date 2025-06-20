
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, signInAnonymously, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
// Storage initialization was removed.

// --- Enhanced Debugging ---
console.log("--- Firebase Client Initialization (src/lib/firebase.ts) ---");
const nodeEnv = process.env.NODE_ENV;
console.log(`Current NODE_ENV: ${nodeEnv}`);

if (typeof window !== 'undefined' && nodeEnv === 'development') {
  console.warn("IMPORTANT: Running in local development. Firebase config below should be loaded from '.env.local' in your project root.");
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    const message = "CRITICAL LOCAL DEV WARNING: NEXT_PUBLIC_FIREBASE_API_KEY is missing or undefined. Firebase will fail to initialize correctly. Ensure this variable is set in your .env.local file and that you have restarted your Next.js development server.";
    console.error(message);
    // You might see a Firebase 'auth/invalid-api-key' error shortly after this log.
  }
}
// --- End Enhanced Debugging ---

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Config object expects this key even if storage service isn't actively used by this file.
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Log effective environment variable values
console.log("--- Firebase Client Config Values Being Used (src/lib/firebase.ts) ---");
console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", firebaseConfig.apiKey ? `SET (Value starts with: ${firebaseConfig.apiKey.substring(0, Math.min(5, firebaseConfig.apiKey.length))}...)` : "NOT SET - THIS IS THE LIKELY CAUSE OF 'auth/invalid-api-key'!");
console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", firebaseConfig.authDomain ? `SET (Value: ${firebaseConfig.authDomain})` : "NOT SET");
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", firebaseConfig.projectId ? `SET (Value: ${firebaseConfig.projectId})` : "NOT SET");
console.log("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", firebaseConfig.storageBucket ? `SET (Value: ${firebaseConfig.storageBucket})` : "NOT SET (but config object expects it)");
console.log("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", firebaseConfig.messagingSenderId ? `SET (Value: ${firebaseConfig.messagingSenderId})` : "NOT SET");
console.log("NEXT_PUBLIC_FIREBASE_APP_ID:", firebaseConfig.appId ? `SET (Value: ${firebaseConfig.appId})` : "NOT SET");
console.log("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:", firebaseConfig.measurementId ? `SET (Optional - Value: ${firebaseConfig.measurementId})` : "NOT SET (Optional)");
console.log("--- End Firebase Client Config Values ---");


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing in the final firebaseConfig object. Firebase initialization will fail. Please check your '.env.local' file and ensure your Next.js development server was restarted after any changes to it.");
}

if (getApps().length === 0) {
  // This will throw the 'auth/invalid-api-key' if apiKey is indeed missing/invalid here.
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db, signInAnonymously, onAuthStateChanged, type FirebaseUser };
