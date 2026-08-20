# ADMIN GUIDE for The Formby Commons

## 1. Introduction

This guide is for site administrators of The Formby Commons. It outlines how to manage content and, most importantly, how to set up an administrator account.

Your primary responsibilities include moderating user-submitted content and ensuring the integrity of the data. To do this, you need an admin account.

## 2. How Admin Setup Works (The Two Parts)

Setting up an admin involves two different sets of Firebase credentials for security:

1.  **Firebase Client SDK (for Browser Login):** This is what your login page (`/admin/login`) uses. It's configured with public keys from your `apphosting.yaml` file (`NEXT_PUBLIC_*` variables) and is safe to run in the browser. It proves *who you are*.

2.  **Firebase Admin SDK (for Server Permissions):** This runs on the server. After you log in, the server uses the Admin SDK to check if your user account has special `admin: true` permission. This SDK uses private, secret credentials. This guide shows you how to run a secure, one-time script to grant this permission to a user.

## 3. Admin Setup: Step-by-Step

### Step A: Create the User in Firebase Console

1.  Go to the **[Firebase Console](https://console.firebase.google.com/)** and select your project (`act-local-glow`).
2.  In the left-hand menu, go to **Build > Authentication**.
3.  Click the **"Add user"** button.
4.  Enter the user's email (e.g., `felix.zajitschek@gmail.com`) and a secure password.
5.  Click **"Add user"**.

### Step B: Get the New User's UID

1.  After creating the user, they will appear in the user list.
2.  Find the new user and copy their **User UID**. It's a long string of letters and numbers (e.g., `aBCdEfgHiJkLmNoPqRsTuVwXyZ1`). You will need this for the final step.

### Step C: Create the `.env.local` File (For the Script ONLY)

The admin script needs credentials to securely connect to your Firebase project. You will provide these in a special file that is **only used for this one-time script** and is kept private.

1.  In the Firebase Studio file explorer on the left, right-click on the empty space at the bottom of the file list and select **"New File"**.
2.  Name the file exactly: `.env.local`
3.  Copy the following block of text and paste it into the new `.env.local` file:
    ```
    # --- For the set-admin script ONLY ---
    # These credentials are NOT used by the running web application.
    FIREBASE_ADMIN_PROJECT_ID="act-local-glow"
    FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-fbsvc@act-local-glow.iam.gserviceaccount.com"
    FIREBASE_ADMIN_PRIVATE_KEY="YOUR_SECRET_PRIVATE_KEY"
    ```
4.  **Replace `YOUR_SECRET_PRIVATE_KEY`:**
    *   Find the value in Google Cloud's **Secret Manager**.
    *   The secret name is `act-local-glow-cloud-google-secret`.
    *   View the latest version's "Secret value".
    *   Copy the entire key (it's very long and starts with `-----BEGIN PRIVATE KEY-----`) and paste it inside the quotes. **The key must be on a single line.**

### Step D: Run the Admin Script in the Studio Terminal

1.  At the bottom of Firebase Studio, open the **Terminal** tab.
2.  Type the following command, replacing `THE_USER_ID_YOU_COPIED` with the actual User UID from Step B.
    ```bash
    npm run set-admin THE_USER_ID_YOU_COPIED
    ```
3.  Press Enter. If it's successful, you will see a confirmation message like `✅ Successfully set admin claim for user...`.

### Step E: Log In

The user is now an admin! They may need to log out and log back in if they were already logged in. They can now go to `/admin/login` and access the dashboard.
**Note:** You can safely delete the `.env.local` file after you have successfully set up your admin users.

## 4. Managing Application Limits

To protect the application from abuse and control database costs, there are daily limits imposed on actions that can be performed by anonymous (non-admin) users.

These limits are:
-   **Suggestion Submissions:** How many new "Actions" a single user can suggest per day.
-   **Voting:** How many times a single user can vote on different "Actions" per day.

### How to Change the Limits

These limits are not set in the Firebase Console. They are defined directly in the application code for easy access and modification.

1.  In the Firebase Studio file explorer, open the following file:
    `src/lib/actions.ts`

2.  At the very top of the file, you will see these two constants:
    ```javascript
    const ANONYMOUS_USER_DAILY_SUGGESTION_LIMIT = 10;
    const ANONYMOUS_USER_DAILY_VOTE_LIMIT = 5;
    ```

3.  To change a limit, simply edit the number. For example, to increase the daily vote limit to 10, you would change the line to:
    ```javascript
    const ANONYMOUS_USER_DAILY_VOTE_LIMIT = 10;
    ```
4.  Save the file. The change will be applied the next time your application is deployed.

## 5. Admin workflow (Client-only auth) — Static export notes

- **Login:** the `/admin/login` page authenticates using the Firebase Client SDK (`signInWithEmailAndPassword`) in the browser. GitHub Pages is static-only — there is no server to create secure server-side sessions.
- **Admin UI gating:** admin pages use `onAuthStateChanged` (client-side) to detect signed-in users and show admin controls. This protects the UI but does not prevent a motivated user from calling Firestore directly.
- **Assigning admin privileges:** granting an `admin: true` custom claim requires the Firebase Admin SDK and must be performed from a secure environment (a one-time script, Cloud Function, or CI job). Do not run the Admin SDK in the browser. After a claim is set, a signed-in client can read that claim and see admin UI.
- **Security caveats:**
    - Any privileged writes performed directly from the browser are potentially discoverable and reproducible by attackers. Where possible, perform sensitive operations (approve/publish/delete) on a secure server using the Admin SDK.
    - Never commit Admin SDK credentials. If you use a temporary `.env.local` for a one-time script, delete it immediately and store secrets in a secure secret manager.
    - Harden Firestore rules: allow public reads for published data and restrict writes/approvals to server-side logic or to users with verified admin claims.
- **Recommendations:**
    - Prefer serverless endpoints (Vercel/Firebase Functions) to run Admin SDK operations for approve/delete/edit workflows.
    - Use strong admin passwords and enable 2FA where possible.
    - Keep an audit log of admin actions and rotate secrets after use.

