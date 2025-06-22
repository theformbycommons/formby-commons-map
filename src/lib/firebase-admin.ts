
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// A cached instance of the initialized Firebase Admin App.
let adminApp: App | null = null;
let initializationError: string | null = null;

// This function initializes the Firebase Admin SDK and caches the app instance.
// It's designed to be called by getAdminAuth() and getAdminDb().
// It will either return a fully initialized App instance or throw an error.
function initializeAdminApp(): App {
    // If the app is already initialized and cached, return it immediately.
    if (adminApp) {
        return adminApp;
    }

    // If we've already tried and failed, throw the stored error to avoid retrying.
    if (initializationError) {
        throw new Error(initializationError);
    }
    
    // Check if an app with this name was already initialized elsewhere.
    const existingApp = getApps().find(app => app?.name === 'firebase-admin-app');
    if (existingApp) {
        adminApp = existingApp;
        return adminApp;
    }

    try {
        const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

        // A clear check for all necessary credentials.
        if (!projectId || !clientEmail || !privateKey) {
            initializationError = "Firebase Admin SDK Error: One or more required environment variables (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) are missing on the server.";
            console.error(initializationError);
            throw new Error(initializationError);
        }
        
        // Environment variables often escape newline characters. This fixes them.
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

        console.log("Attempting to initialize Firebase Admin SDK...");
        adminApp = initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey: formattedPrivateKey,
            }),
        }, 'firebase-admin-app'); // Use a unique name to avoid conflicts

        console.log("Firebase Admin SDK initialized successfully.");
        return adminApp;

    } catch (error: any) {
        initializationError = `CRITICAL: Firebase Admin SDK Initialization FAILED. Details: ${error.message}`;
        console.error(initializationError, error.stack);
        // Rethrow the error so the calling function knows initialization failed.
        throw new Error(initializationError);
    }
}

// Returns an initialized Auth instance or throws if initialization fails.
export function getAdminAuth(): Auth {
    const app = initializeAdminApp();
    return getAuth(app);
}

// Returns an initialized Firestore instance or throws if initialization fails.
export function getAdminDb(): Firestore {
    const app = initializeAdminApp();
    return getFirestore(app);
}
