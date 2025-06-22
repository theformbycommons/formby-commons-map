# ADMIN GUIDE for Local Glow

## 1. Introduction

This guide is for site administrators of Local Glow. It outlines how to manage content, oversee site operations, and troubleshoot common issues. Your primary responsibilities include moderating user-submitted content (location suggestions and comments) and ensuring the integrity of the data in Firestore and Firebase Storage.

## 2. Accessing the Admin Panel

### 2.1. Logging In
1.  Navigate to `/admin/login` in your browser (e.g., `yourdomain.com/admin/login`).
2.  Enter your administrator email and password.
3.  Click "Sign In".

### 2.2. Admin User Setup (Important Prerequisite)
For a user to successfully log in as an admin, their Firebase Authentication user account **must** have a special permission set called a "custom claim." This guide shows you how to set the required `admin: true` claim for a user, doing everything inside your web browser using Firebase Console and Firebase Studio.

**Step A: Create the User in Firebase Console**
1.  Go to the **[Firebase Console](https://console.firebase.google.com/)** and select your project (`act-local-glow`).
2.  In the left-hand menu, go to **Build > Authentication**.
3.  Click the **"Add user"** button.
4.  Enter the user's email (e.g., `felix.zajitschek@gmail.com`) and a secure password.
5.  Click **"Add user"**.

**Step B: Get the New User's UID**
1.  After creating the user, they will appear in the user list.
2.  Find the new user and copy their **User UID**. It's a long string of letters and numbers (e.g., `aBCdEfgHiJkLmNoPqRsTuVwXyZ1`). You will need this for the final step.

**Step C: Create the `.env.local` File in Firebase Studio**
The admin script needs credentials to securely connect to your Firebase project. You will provide these in a special file that is kept private and not checked into your code repository.
1.  In the Firebase Studio file explorer on the left, right-click on the empty space at the bottom of the file list and select **"New File"**.
2.  Name the file exactly: `.env.local`
3.  Copy the following block of text and paste it into the new `.env.local` file:
    ```
    # Firebase Admin SDK Credentials
    # IMPORTANT: Fill these values in from your Google Cloud / Firebase project.
    FIREBASE_ADMIN_PROJECT_ID=""
    FIREBASE_ADMIN_CLIENT_EMAIL=""
    FIREBASE_ADMIN_PRIVATE_KEY=""
    ```
4.  **Fill in the values:**
    *   `FIREBASE_ADMIN_PROJECT_ID`: This is your project ID, `act-local-glow`.
    *   `FIREBASE_ADMIN_CLIENT_EMAIL`: Find this in your **Firebase Console > Project Settings > Service accounts**. It looks like `firebase-adminsdk-xxxxx@act-local-glow.iam.gserviceaccount.com`.
    *   `FIREBASE_ADMIN_PRIVATE_KEY`: This is a secret. In **Firebase Console > Project Settings > Service accounts**, select the "App Engine default service account" and under the "Keys" tab, you might need to create a new key (JSON type). **Open the downloaded JSON file**, find the `private_key` field, and copy the entire key string (it starts with `-----BEGIN PRIVATE KEY-----` and ends with `-----END PRIVATE KEY-----\n`). Paste this entire string inside the quotes for `FIREBASE_ADMIN_PRIVATE_KEY`. **IMPORTANT:** The key must be on a single line within the quotes. The `\n` characters inside the key string are important and should be preserved.

**Step D: Run the Admin Script in the Studio Terminal**
1.  At the bottom of Firebase Studio, open the **Terminal** tab.
2.  Type the following command, replacing `THE_USER_ID_YOU_COPIED` with the actual User UID from Step B.
    ```bash
    npm run set-admin THE_USER_ID_YOU_COPIED
    ```
3.  Press Enter. If it's successful, you will see a confirmation message like `✅ Successfully set admin claim for user...`.

**Step E: Log In**
The user is now an admin! They may need to log out and log back in for the new permission to take effect. They can then access the `/admin/login` page.

## 3. Managing Location Suggestions (via Admin Panel)
... (rest of guide is unchanged) ...
