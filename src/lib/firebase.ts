import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, signInAnonymously, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';

// Your new web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALKmzxvpnYwuuS_PSnXDUhfhddTsZqqHU",
  authDomain: "formby-commons-map.firebaseapp.com",
  projectId: "formby-commons-map",
  storageBucket: "formby-commons-map.firebasestorage.app",
  messagingSenderId: "440463030703",
  appId: "1:440463030703:web:eda4658c8b51005fc1575a",
  measurementId: "G-HCXGM3D6KL"
};

// Check for the API key
if (!firebaseConfig.apiKey) {
  console.error(`
    CRITICAL ERROR: Firebase API Key is missing!
    Please check your configuration in firebase.ts.
  `);
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | undefined;

// Initialize Firebase app singleton
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

// Initialize analytics only on the client side (browser)
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  analytics = getAnalytics(app);
}

export { app, auth, db, analytics, signInAnonymously, onAuthStateChanged, type FirebaseUser };