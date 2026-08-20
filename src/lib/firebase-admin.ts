
// Firebase Admin helper removed for static-export compatibility.
// If you need server-side admin operations (setting claims, revoking sessions,
// migrating data, etc.), implement them in a separate serverless function
// or a secure backend that imports the Firebase Admin SDK.

export function getAdminAuth() {
  throw new Error('Firebase Admin SDK is not available in the static export. Implement admin operations in a server-side endpoint.');
}

export function getAdminDb() {
  throw new Error('Firebase Admin SDK is not available in the static export. Implement admin operations in a server-side endpoint.');
}
