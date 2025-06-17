
# ADMIN GUIDE for Local Glow

## 1. Introduction

This guide is for site administrators of Local Glow. It outlines how to manage content, oversee site operations, and troubleshoot common issues. Your primary responsibilities include moderating user-submitted content (location suggestions and comments) and ensuring the integrity of the data in Firestore and Firebase Storage.

## 2. Accessing the Admin Panel

### 2.1. Logging In
1.  Navigate to `/admin/login` in your browser (e.g., `yourdomain.com/admin/login`).
2.  Enter your administrator email and password.
3.  Click "Sign In".

### 2.2. Admin User Setup (Important Prerequisite)
For a user to successfully log in as an admin, their Firebase Authentication user account **must** have a custom claim `admin: true` set.

**How to set custom claims:**
This usually requires the Firebase Admin SDK. Since this project uses `firebase-admin` for server-side operations:
*   **Option 1 (Using a script - Recommended for one-off setups):**
    1.  You'll need Node.js and your Firebase Admin SDK credentials.
    2.  Create a local `.js` file (e.g., `setAdmin.js`):
        ```javascript
        // setAdmin.js
        // Ensure you have firebase-admin installed: npm install firebase-admin
        // IMPORTANT: Replace with your actual service account key details or ensure
        // environment variables (FIREBASE_ADMIN_PROJECT_ID, etc.) are set in the environment
        // where you run this script.

        const admin = require('firebase-admin');

        // Option A: Using a service account key JSON file (download from Firebase Project Settings > Service accounts)
        // const serviceAccount = require("./path/to/your-serviceAccountKey.json");
        // admin.initializeApp({
        //   credential: admin.credential.cert(serviceAccount)
        // });

        // Option B: If running in an environment where admin SDK is already initialized via default creds
        // or environment variables (like a Cloud Function or this project's setup if env vars are available locally)
        // For local script using project's env vars, you might need to load them, e.g. with `dotenv`
        if (!admin.apps.length) {
            // This attempts to mimic the setup in src/lib/firebase-admin.ts
            // Ensure FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY are set
            const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
            });
        }

        const uid = 'USER_UID_TO_MAKE_ADMIN'; // <-- !!! REPLACE WITH THE ACTUAL USER ID !!!

        admin.auth().setCustomUserClaims(uid, { admin: true })
          .then(() => {
            console.log('Successfully set admin claim for user:', uid);
            return admin.auth().getUser(uid);
          })
          .then((userRecord) => {
            console.log('Updated user claims:', userRecord.customClaims);
            process.exit(0);
          })
          .catch(error => {
            console.error('Error setting admin claim:', error);
            process.exit(1);
          });
        ```
    3.  Replace `'USER_UID_TO_MAKE_ADMIN'` with the actual Firebase UID of the user. You can find the UID in the Firebase Console -> Authentication -> Users tab.
    4.  Ensure your environment variables for `firebase-admin` are accessible to this script or use a service account JSON file.
    5.  Run the script: `node setAdmin.js`.
*   **Option 2 (Temporary API Route - Use with extreme caution):**
    You could temporarily create a secure API route in your Next.js app that uses `adminAuth.setCustomUserClaims()`. This is risky if not properly secured and should be removed immediately after use.
*   **After setting the claim:** The user must log out and log back in for the new claim to be included in their ID token, which is then verified by the `/api/auth/session-login` route.

## 3. Managing Location Suggestions (via Admin Panel)

Navigate to `/admin/suggestions` after logging in.

### 3.1. Reviewing Suggestions
*   The page lists all suggestions, showing details like name, description, town, category, submitted image (if any), suggester name, and current status.
*   Status badges indicate:
    *   **Pending:** New suggestion awaiting review.
    *   **Approved (Diagnostic Mode):** Suggestion's status has been updated in Firestore. **All other publishing steps (town creation, location creation) are currently BYPASSED and MUST be done manually by the admin.** (This is a temporary state due to ongoing troubleshooting of the automated publishing process).
    *   **Rejected:** Suggestion has been reviewed and not published.

### 3.2. Approving Suggestions (Currently Highly Simplified Workflow - DIAGNOSTIC STEP)
1.  For a "Pending" suggestion, click **"Approve & Publish"**.
2.  **Action (TEMPORARILY SIMPLIFIED FOR DIAGNOSIS):**
    *   The suggestion's `status` in the `suggestedLocations` collection in Firestore is updated to `approved`.
    *   You will receive a toast message confirming only this status update. **No new town or location documents will be automatically created by this action at this stage.**
3.  **IMPORTANT: MANUAL STEPS REQUIRED BY ADMIN AFTER CLICKING "Approve & Publish" (Due to current technical limitations being diagnosed):**
    *   **A. Create Town (if new):** If the `townName` in the suggestion does not already exist as a document in the `towns` collection in Firestore, you **MUST manually create the town document**. See section 5.2 for details on the required fields.
    *   **B. Create Location:** You **MUST manually create a new document in the `locations` collection** in Firestore for this approved suggestion.
        *   Copy relevant details like `name`, `description`, `imageUrl` (if any), `category`, `coordinates`, and `submittedBy` (from the `suggesterName` field of the suggestion) into the new location document.
        *   Ensure the `townId` (document ID of the town from step A or existing town) and `townName` are correctly set in the new location document.
        *   Add a `createdAtFirestore` field (e.g., manually set current date as a Timestamp in Firestore console or use `FieldValue.serverTimestamp()` if that becomes reliable later) and an empty `comments: []` array to the new location document.
    *   **C. Link Suggestion to Published Location:** After creating the location document (Step B), copy its auto-generated ID. Go back to the original document in the `suggestedLocations` collection (the one whose status you just updated to 'approved') and manually add/update a field named `publishedLocationId` with this new location ID. You might also want to manually add an `approvedAtFirestore` field.

    **Note:** This highly manual process is a temporary measure while we diagnose issues with the automated publishing features. The goal is to restore full automation.

### 3.3. Deleting Suggestions
1.  Click **"Delete"** for any suggestion.
2.  A confirmation dialog will appear.
3.  **Action:**
    *   Permanently removes the suggestion document from the `suggestedLocations` collection.
    *   If an `imageUrl` was associated with the suggestion, the system attempts to delete this image from Firebase Storage.

### 3.4. Managing in Firebase Console (For Rejection or Advanced Edits)
1.  Click **"Manage in Firebase Console"**. This opens the specific suggestion document directly in your Firestore database.
2.  **To Reject a Suggestion:**
    *   In the Firestore document, manually change the `status` field from `pending` to `rejected`.
    *   You might also want to add a `rejectedAtFirestore` field for tracking.
3.  **To Edit a Suggestion before Approval:**
    *   Directly modify any fields (e.g., `name`, `description`, `category`) in the Firestore document. Save the changes. Then you can use the (simplified) "Approve & Publish" button and follow the manual steps in 3.2.

## 4. Managing Comments (Directly in Firestore)

New comments submitted by users are added to the `suggestedComments` collection in Firestore with a `status` of `pending`.

### 4.1. Accessing and Reviewing Pending Comments
1.  Go to the **Firebase Console**.
2.  Navigate to **Firestore Database**.
3.  Select the `suggestedComments` collection.
4.  You can filter or sort by the `status` field to find all "pending" comments.
5.  Review the `commentText`, `userName`, and associated `locationName` / `locationId`.

### 4.2. Approving Comments
1.  In the Firestore document for the specific `suggestedComments` entry:
2.  Change the `status` field from `pending` to `approved`.
3.  Optionally, set an `approvedAtFirestore` field (e.g., manually set current Timestamp).
4.  **Outcome:** Approved comments will automatically be fetched and displayed on the relevant location's page. The `getLocationById` and `getLocationsByTownId` functions in `src/lib/data.ts` merge these approved comments with any pre-existing comments in the `locations` document.

### 4.3. Rejecting Comments
1.  In the Firestore document for the `suggestedComments` entry:
2.  Change the `status` field from `pending` to `rejected`.
3.  Alternatively, you can simply delete the document from the `suggestedComments` collection.

### 4.4. Deleting Published/Live Comments
If a comment was previously approved and is now live on a location page, but needs to be removed:
1.  **Primary Action:** Go to the `locations` collection in Firestore.
2.  Find the document for the specific location.
3.  Edit the `comments` array field within that document. Remove the entire comment object (the array element corresponding to the comment you want to delete).
4.  **Secondary Action (Recommended):** Also, find the original comment in the `suggestedComments` collection. Change its `status` to `rejected` or delete the document entirely. This prevents it from being re-processed or re-displayed if data fetching logic changes or if there's a cache.

## 5. Managing Content Directly in Firestore Database

Direct Firestore manipulation is powerful but should be done carefully.

### 5.1. General Firestore Navigation
1.  Go to the **Firebase Console**.
2.  Navigate to **Build -> Firestore Database**.

### 5.2. Managing Towns (`towns` collection)
*   **Adding a New Town (Required before approving suggestions for new towns):**
    1.  If the `towns` collection doesn't exist, click "Start collection". Otherwise, select `towns` and click "Add document".
    2.  Collection ID: `towns`.
    3.  Document ID: Can be auto-generated by Firestore, or you can provide a custom ID (e.g., lowercase, hyphenated town name like `formby-merseyside`).
    4.  **Required Fields:**
        *   `name` (String): e.g., "Formby" (Must exactly match the `townName` in any related suggestions)
        *   `county` (String): e.g., "Merseyside"
        *   `country` (String): e.g., "UK"
        *   `coordinates` (Map):
            *   `lat` (Number): Latitude, e.g., `53.558`
            *   `lng` (Number): Longitude, e.g., `-3.067`
        *   `description` (String): A brief description of the town. Can be an empty string `""` initially.
        *   `imageUrl` (String, Optional): URL to the town's banner image stored in Firebase Storage. (e.g., `gs://<your-bucket-name>/town-images/formby.png` or the public HTTPS URL). Can be `null`.
*   **Editing a Town:** Click on the town's document ID in the `towns` collection, then modify its fields.
*   **Deleting a Town:** Be cautious. Deleting a town document does **not** automatically delete associated locations from the `locations` collection. This could lead to orphaned locations.

### 5.3. Managing Locations (`locations` collection)
*   These documents are **now created manually by the admin** after a suggestion's status is set to "approved" via the admin panel (see section 3.2).
*   **Editing a Location:** Find the document by its ID. You can modify fields like `name`, `description`, `imageUrl`, `category`, `coordinates`.
*   **Deleting a Location:**
    1.  Delete the document from the `locations` collection.
    2.  **Manually delete its associated image** from Firebase Storage (see Section 6). The `imageUrl` field will tell you the path.
    3.  Consider what to do with associated `suggestedComments` for this location ID – they will become orphaned. You may want to delete them from `suggestedComments` as well.

### 5.4. Managing Quotas (`quotaManagement` collection)
This collection helps control storage usage.
*   **`globalStorage` document:**
    *   `maxBytesAllowed` (Number): Total storage limit in bytes for user-uploaded images via suggestions.
    *   `totalBytesUsed` (Number): Automatically incremented by the `submitSuggestion` action.
*   **`dailyUploads` document:**
    *   `maxBytesPerDay` (Number): Daily storage upload limit in bytes.
    *   `bytesUploadedToday` (Number): Auto-incremented, resets based on `lastResetDate`.
    *   `lastResetDate` (String, YYYY-MM-DD): Tracks when `bytesUploadedToday` was last reset.
*   **Adjusting Quotas:** Manually edit `maxBytesAllowed` or `maxBytesPerDay` values. To reset `totalBytesUsed` or `bytesUploadedToday`, set them to `0`.

### 5.5. Managing Anonymous User Daily Limits
These collections track submissions from anonymous users to prevent abuse. Document IDs are the anonymous user UIDs.
*   **`userDailySuggestionLimits` collection:**
    *   `count` (Number): Number of suggestions submitted by this user today.
    *   `lastSubmissionDate` (String, YYYY-MM-DD).
*   **`userDailyCommentLimits` collection:**
    *   `count` (Number): Number of comments submitted by this user today.
    *   `lastCommentDate` (String, YYYY-MM-DD).
*   **Resetting/Adjusting Limits for a User:** To reset a user's daily count, you can change their respective date field to a previous date, set `count` to 0, or delete their document from the collection.

## 6. Managing Images in Firebase Storage

1.  Go to the **Firebase Console**.
2.  Navigate to **Build -> Storage**.
3.  Files are organized into folders (paths).

### 6.1. Image Paths
*   **Location Suggestions:** `suggested_location_images/` (images uploaded with new suggestions).
*   **Published Locations:** Images for published locations currently re-use the URL from `suggested_location_images/` if the admin copies it during manual location creation. If a suggestion's image is deleted after approval, the live location might show a broken image unless this is handled.
*   **Town Banners:** `town-images/` (e.g., `formby.png`, `windermere.jpg`).
*   **Placeholder Images:** (Stored in `town-images/` for convenience by the app's current setup)
    *   `green_town_placeholder.png` (Used by `TownBannerImage.tsx`)
    *   `painted_town_preview_placeholder.png` (Used by `TownPreviewImage.tsx`)

### 6.2. Uploading/Replacing Images
*   Use the "Upload file" button in the Storage browser.
*   Ensure filenames and paths match what the application expects (e.g., for town banners, `town-images/town-name.png`).
*   After uploading, you can get the public HTTPS URL or the `gs://` path. You might need to update the corresponding `imageUrl` field in Firestore documents (`towns` or `locations` collections).

### 6.3. Deleting Images
*   If you delete a location or suggestion from Firestore, its associated image in Storage is **not always automatically deleted** by Firestore itself.
    *   The `deleteSuggestion` action *attempts* to delete the image from `suggested_location_images/`.
    *   If you manually delete a `locations` document, you **must manually delete** its image from Storage.
*   Use the `imageUrl` from the Firestore document to find the file path in Storage.
    *   Example: Public URL `https://firebasestorage.googleapis.com/v0/b/YOUR_BUCKET_NAME/o/suggested_location_images%2Fimage.jpg?alt=media...`
    *   The path within your bucket is `suggested_location_images/image.jpg`.

## 7. Troubleshooting: Rescuing a Broken Web App in Firebase Studio

Firebase Studio provides a Git-based workflow. If code changes lead to a broken state in your web preview:

1.  In Firebase Studio, look for the **"Source Code"** panel or a way to access the integrated terminal.
2.  If you have an integrated terminal (often labeled "Git Bash", "Terminal", etc.):
3.  To discard all local uncommitted changes and revert your Firebase Studio workspace to match the last committed state on the `master` (or `main`) branch of your connected GitHub repository, run the following command:

    ```bash
    git reset --hard origin/master
    ```
    *(Replace `master` with `main` if your default branch is named `main`)*

4.  **WARNING: THIS IS A DESTRUCTIVE COMMAND.**
    *   It will **permanently delete any uncommitted changes** you've made in Firebase Studio.
    *   Use this command with extreme caution and only if you are certain you want to revert to the last known good state from your repository.
    *   This assumes your `origin/master` (or `origin/main`) branch in your GitHub repo is in a good, working state.
5.  After running the command, your local files in Firebase Studio should be reset. The web preview might take a moment to rebuild or may require a manual refresh.

This guide should cover the main administrative tasks. Refer to the Firebase documentation for more in-depth information on Firestore, Authentication, and Storage.

    
