#!/usr/bin/env node

/**
 * @fileoverview A command-line script to grant admin privileges to a Firebase user.
 * This script is intended to be run from the Firebase Studio terminal.
 *
 * Usage:
 * npm run set-admin <UID>
 *
 * Example:
 * npm run set-admin aBCdEfgHiJkLmNoPqRsTuVwXyZ1
 *
 * It uses the Firebase Admin SDK configuration from `src/lib/firebase-admin.ts`,
 * which relies on environment variables (loaded via --env-file in package.json)
 * to authenticate securely.
 */

import { getAdminAuth } from '../src/lib/firebase-admin.js';

async function main() {
  const uid = process.argv[2];

  if (!uid) {
    console.error('\nError: User UID is required.');
    console.error('Usage: npm run set-admin <UID>\n');
    process.exit(1);
  }

  const adminAuth = getAdminAuth();

  if (!adminAuth) {
    console.error('\nError: Firebase Admin SDK failed to initialize.');
    console.error('Please ensure your .env.local file is correctly configured with the required admin credentials.\n');
    process.exit(1);
  }

  try {
    console.log(`Setting 'admin: true' custom claim for user: ${uid}...`);
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    
    // Verify the claim was set
    const userRecord = await adminAuth.getUser(uid);
    
    if (userRecord.customClaims?.admin === true) {
      console.log('\n✅ Success!');
      console.log(`Successfully set admin claim for user: ${userRecord.email} (${uid})`);
      console.log('Updated claims:', userRecord.customClaims);
      console.log('\nThis user can now log in to the /admin/login page.');
    } else {
      throw new Error('Claim was not set correctly. Verification failed.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting admin claim:');
    if (error.code === 'auth/user-not-found') {
      console.error(`No user found with the UID: "${uid}". Please check the UID and try again.`);
    } else {
      console.error(error.message);
    }
    console.error('\nPlease check that the UID is correct and that your .env.local file has valid credentials.\n');
    process.exit(1);
  }
}

main();
