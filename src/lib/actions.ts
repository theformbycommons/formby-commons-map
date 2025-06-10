
'use server';

import { z } from 'zod';
import type { NewLocationSuggestion, Location, LocationComment, SuggestedComment } from './types';
import { adminDb, adminStorage } from './firebase-admin';
import { getTownByName, getLocationById } from './data'; // getLocationById will be used for comment moderation
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';


// Zod schema for server-side validation (SuggestLocationForm)
const SuggestionFormSchemaServer = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  townName: z.string().min(2, "Town name is required").max(50),
  category: z.string().min(1, "Category is required"),
  suggesterName: z.string().min(2, "Your name must be at least 2 characters").max(50),
  imageUrl: z.string().url("Invalid image URL.").optional().nullable(),
  uploadedImageSize: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().nonnegative("Image size must be a non-negative number.").optional().nullable()
  ),
  latitude: z.preprocess(
    (val) => Number(val),
    z.number().min(-90, "Invalid latitude. Please select a location on the map.").max(90, "Invalid latitude. Please select a location on the map.")
  ),
  longitude: z.preprocess(
    (val) => Number(val),
    z.number().min(-180, "Invalid longitude. Please select a location on the map.").max(180, "Invalid longitude. Please select a location on the map.")
  ),
  suggesterUid: z.string().min(1, "User ID is missing.").optional(),
});

export interface SuggestionFormState {
  message: string;
  type: 'success' | 'error' | 'info';
  errors?: Record<string, (string[] | undefined)>;
  submittedSuggestionData?: Omit<NewLocationSuggestion, 'suggesterComment'>;
}

const DEFAULT_MAX_GLOBAL_BYTES = 1 * 1024 * 1024 * 1024; // 1GB
const DEFAULT_MAX_DAILY_BYTES = 50 * 1024 * 1024; // 50MB
const APPROX_NON_IMAGE_DATA_SIZE = 1.5 * 1024; 

async function checkAndIncrementQuotas(dataSizeBytes: number): Promise<{ allowed: boolean; message?: string }> {
  const todayDateString = new Date().toISOString().split('T')[0];

  try {
    const globalQuotaRef = adminDb.collection('quotaManagement').doc('globalStorage');
    const dailyQuotaRef = adminDb.collection('quotaManagement').doc('dailyUploads');

    await adminDb.runTransaction(async (transaction) => {
      const globalQuotaDoc = await transaction.get(globalQuotaRef);
      const dailyQuotaDoc = await transaction.get(dailyQuotaRef);

      if (!globalQuotaDoc.exists || !dailyQuotaDoc.exists) { 
        throw new Error("Quota configuration documents not found in Firestore. Please set them up in 'quotaManagement' collection.");
      }

      let { maxBytesAllowed = DEFAULT_MAX_GLOBAL_BYTES, totalBytesUsed = 0 } = globalQuotaDoc.data() || {};
      let { maxBytesPerDay = DEFAULT_MAX_DAILY_BYTES, bytesUploadedToday = 0, lastResetDate } = dailyQuotaDoc.data() || {};

      if (lastResetDate !== todayDateString) {
        bytesUploadedToday = 0;
        transaction.update(dailyQuotaRef, { bytesUploadedToday: 0, lastResetDate: todayDateString });
      }

      if (totalBytesUsed + dataSizeBytes > maxBytesAllowed) {
        throw new Error('Overall storage limit reached. We are sorry, but at the moment, the site can\'t accept any new location submissions.');
      }

      if (bytesUploadedToday + dataSizeBytes > maxBytesPerDay) {
        throw new Error('Daily upload limit reached. We are sorry, but at the moment, the site can\'t accept any new location submissions. Please try again tomorrow.');
      }

      transaction.update(globalQuotaRef, { totalBytesUsed: FieldValue.increment(dataSizeBytes) });
      transaction.update(dailyQuotaRef, { bytesUploadedToday: FieldValue.increment(dataSizeBytes) });
    });

    return { allowed: true };

  } catch (error: any) {
    console.error("Error in checkAndIncrementQuotas (using adminDb):", error);
    return { allowed: false, message: error.message || "Failed to verify storage quotas." };
  }
}

const ANONYMOUS_USER_DAILY_SUBMISSION_LIMIT = 10;

async function checkAndIncrementAnonymousUserDailyLimit(uid: string, limit: number, collectionName: string, dateFieldName: string, countFieldName: string = 'count'): Promise<{ allowed: boolean; message?: string }> {
  const todayDateString = new Date().toISOString().split('T')[0];
  const userLimitRef = adminDb.collection(collectionName).doc(uid);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const userLimitDoc = await transaction.get(userLimitRef);

      if (!userLimitDoc.exists) {
        transaction.set(userLimitRef, {
          [countFieldName]: 1,
          [dateFieldName]: todayDateString,
        });
        return;
      }

      const data = userLimitDoc.data()!;
      if (data[dateFieldName] !== todayDateString) {
        transaction.update(userLimitRef, {
          [countFieldName]: 1,
          [dateFieldName]: todayDateString,
        });
        return;
      }

      if (data[countFieldName] >= limit) {
        throw new Error(`You have reached the daily limit of ${limit} submissions for this action. Please try again tomorrow.`);
      }

      transaction.update(userLimitRef, { [countFieldName]: FieldValue.increment(1) });
    });
    return { allowed: true };
  } catch (error: any) {
    console.error(`Error checking/incrementing daily limit for UID ${uid} in ${collectionName}:`, error);
    return { allowed: false, message: error.message || `Failed to verify daily submission limit for this action.` };
  }
}


export async function submitSuggestion(
  prevState: SuggestionFormState | undefined,
  formData: FormData
): Promise<SuggestionFormState> {

  const imageUrlValue = formData.get('imageUrl');
  const uploadedImageSizeValue = formData.get('uploadedImageSize');
  const suggesterUidValue = formData.get('suggesterUid');

  const rawFormData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    townName: formData.get('townName') as string,
    category: formData.get('category') as string,
    suggesterName: formData.get('suggesterName') as string,
    imageUrl: imageUrlValue === null || String(imageUrlValue).trim() === '' ? undefined : String(imageUrlValue),
    uploadedImageSize: uploadedImageSizeValue === null || String(uploadedImageSizeValue).trim() === '' ? undefined : String(uploadedImageSizeValue),
    latitude: formData.get('latitude') as string,
    longitude: formData.get('longitude') as string,
    suggesterUid: suggesterUidValue === null || String(suggesterUidValue).trim() === '' ? undefined : String(suggesterUidValue),
  };

  const validatedFields = SuggestionFormSchemaServer.safeParse(rawFormData);

  if (!validatedFields.success) {
    const flatErrors = validatedFields.error.flatten();
    let detailedErrorMessage = "Validation failed. Details: ";
    for (const [field, messages] of Object.entries(flatErrors.fieldErrors)) {
        if (messages) detailedErrorMessage += `${field}: ${messages.join(', ')}; `;
    }
    if (flatErrors.formErrors.length > 0) {
        detailedErrorMessage += `Form errors: ${flatErrors.formErrors.join(', ')}; `;
    }
    return {
      message: detailedErrorMessage.length > "Validation failed. Details: ".length ? detailedErrorMessage : "Validation failed. Please check form fields.",
      type: 'error',
      errors: flatErrors.fieldErrors,
    };
  }

  const { latitude, longitude, suggesterUid, ...dataFromValidation } = validatedFields.data;
  
  const dataForFirestore: Record<string, any> = { ...dataFromValidation };
  delete dataForFirestore.uploadedImageSize; 

  if (dataForFirestore.imageUrl === undefined) {
    dataForFirestore.imageUrl = null;
  }

  try {
    if (suggesterUid) {
      const dailyLimitCheck = await checkAndIncrementAnonymousUserDailyLimit(suggesterUid, ANONYMOUS_USER_DAILY_SUBMISSION_LIMIT, 'userDailySuggestionLimits', 'lastSubmissionDate');
      if (!dailyLimitCheck.allowed) {
        return {
          message: dailyLimitCheck.message || "Daily suggestion limit reached.",
          type: 'error',
        };
      }
    }
    
    const dataSizeForQuota = (validatedFields.data.uploadedImageSize || 0) + APPROX_NON_IMAGE_DATA_SIZE;
    const quotaCheckResult = await checkAndIncrementQuotas(dataSizeForQuota);

    if (!quotaCheckResult.allowed) {
      return {
        message: quotaCheckResult.message || "Submission blocked due to storage quota limits.",
        type: 'error',
      };
    }

    const suggestionForDb = {
      name: dataForFirestore.name as string,
      description: dataForFirestore.description as string,
      townName: dataForFirestore.townName as string,
      category: dataForFirestore.category as string,
      suggesterName: dataForFirestore.suggesterName as string,
      imageUrl: dataForFirestore.imageUrl as string | null, 
      status: 'pending' as const,
      submittedAtFirestore: FieldValue.serverTimestamp(),
      coordinates: {
        lat: latitude,
        lng: longitude,
      },
      ...(suggesterUid && { suggesterUid }),
    };


    const suggestedLocationsCol = adminDb.collection('suggestedLocations');
    const newDocRef = await suggestedLocationsCol.add(suggestionForDb);

    revalidatePath('/admin/suggestions');

    return {
      message: `Thank you, ${validatedFields.data.suggesterName}! Your suggestion for "${validatedFields.data.name}" has been received${validatedFields.data.imageUrl ? ' with an image' : ''} and is pending review.`,
      type: 'success',
      submittedSuggestionData: {
        id: newDocRef.id,
        ...suggestionForDb, 
        submittedAt: new Date().toISOString(), // client-side representation
      } as unknown as NewLocationSuggestion, 
    };

  } catch (error: any) {
    let errorMessage = "There was an error submitting your suggestion. Please try again.";
    if (error instanceof Error && error.message) {
      errorMessage = `Error: ${error.message}`;
    } else if (typeof error === 'string') {
      errorMessage = `Error: ${error}`;
    }
    console.error("Error in submitSuggestion action (using adminDb):", error);
    return {
      message: errorMessage,
      type: 'error',
    };
  }
}


export interface ApproveSuggestionFormState {
  message: string;
  type: 'success' | 'error' | 'info';
  suggestionId?: string;
}

export async function approveSuggestion(
  prevState: ApproveSuggestionFormState | undefined,
  formData: FormData
): Promise<ApproveSuggestionFormState> {
  const suggestionId = formData.get('suggestionId') as string;

  if (!suggestionId) {
    return { message: "Suggestion ID is missing.", type: 'error' };
  }

  try {
    const suggestionRef = adminDb.collection('suggestedLocations').doc(suggestionId);
    const suggestionSnap = await suggestionRef.get();

    if (!suggestionSnap.exists) {
      return { message: "Suggestion not found.", type: 'error', suggestionId };
    }

    const suggestionData = suggestionSnap.data() as NewLocationSuggestion;

    if (suggestionData.status !== 'pending') {
      return { message: `Suggestion is already ${suggestionData.status}.`, type: 'info', suggestionId };
    }

    const town = await getTownByName(suggestionData.townName);
    if (!town) {
      return {
        message: `Town "${suggestionData.townName}" not found. Please create the town in the 'towns' collection first before approving this suggestion.`,
        type: 'error',
        suggestionId
      };
    }

    const batch = adminDb.batch();

    const newLocationRef = adminDb.collection('locations').doc();
    const newLocationData: Omit<Location, 'id' | 'createdAt'> & { createdAtFirestore: any } = {
      townId: town.id,
      townName: suggestionData.townName,
      name: suggestionData.name,
      description: suggestionData.description,
      imageUrl: suggestionData.imageUrl || null, 
      category: suggestionData.category,
      coordinates: suggestionData.coordinates,
      submittedBy: suggestionData.suggesterName,
      comments: [],
      createdAtFirestore: FieldValue.serverTimestamp(),
    };
    batch.set(newLocationRef, newLocationData);

    batch.update(suggestionRef, {
      status: 'approved',
      approvedAtFirestore: FieldValue.serverTimestamp(),
      publishedLocationId: newLocationRef.id,
    });

    await batch.commit();

    revalidatePath('/admin/suggestions');
    revalidatePath(`/town/${encodeURIComponent(suggestionData.townName)}`);
    revalidatePath('/');
    revalidatePath(`/location/${newLocationRef.id}`);


    return {
      message: `Suggestion "${suggestionData.name}" approved and published successfully!`,
      type: 'success',
      suggestionId
    };

  } catch (error)
 {
    console.error("Error approving suggestion (using adminDb):", error);
    return {
      message: "Failed to approve suggestion. Please try again.",
      type: 'error',
      suggestionId
    };
  }
}

export interface DeleteSuggestionFormState {
  message: string;
  type: 'success' | 'error' | 'info';
  suggestionId?: string;
}

function getPathFromStorageUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/o/');
    if (pathSegments.length > 1) {
      const encodedPath = pathSegments[1].split('?')[0];
      return decodeURIComponent(encodedPath);
    }
    console.warn(`[Admin Action] Could not parse file path from URL: ${url}. Expected '/o/' separator not found.`);
    return null;
  } catch (e) {
    console.error("[Admin Action] Error parsing storage URL for deletion:", e, "URL was:", url);
    return null;
  }
}

export async function deleteSuggestion(
  prevState: DeleteSuggestionFormState | undefined,
  formData: FormData
): Promise<DeleteSuggestionFormState> {
  const suggestionId = formData.get('suggestionId') as string;
  const imageUrl = formData.get('imageUrl') as string | undefined | null;

  let imageDeletedSuccessfully = !imageUrl;
  let imageDeletionErrorDetails = "";
  let finalMessage = "";
  let finalType: 'success' | 'error' | 'info' = 'info';


  if (!suggestionId) {
    return { message: "Suggestion ID is missing.", type: 'error', suggestionId };
  }

  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
    const filePath = getPathFromStorageUrl(imageUrl);
    if (filePath) {
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const bucket = bucketName ? adminStorage.bucket(bucketName) : adminStorage.bucket();
      const file = bucket.file(filePath);
      
      try {
        console.log(`[Admin Action] Attempting to delete image '${filePath}' from bucket '${bucket.name}'.`);
        await file.delete();
        imageDeletedSuccessfully = true;
        console.log(`[Admin Action] Successfully deleted image '${filePath}' from storage.`);
      } catch (imgErr: any) {
        if (imgErr.code === 404 || (imgErr.errors && imgErr.errors.some((e: any) => e.reason === 'notFound'))) {
          imageDeletionErrorDetails = `Image '${filePath}' not found in storage (may have been already deleted or path is incorrect).`;
          console.warn(`[Admin Action] ${imageDeletionErrorDetails}`);
          imageDeletedSuccessfully = true;
        } else {
          imageDeletionErrorDetails = `Failed to delete image '${filePath}': ${imgErr.message}.`;
          console.error(`[Admin Action] ${imageDeletionErrorDetails}`, imgErr);
          imageDeletedSuccessfully = false;
        }
      }
    } else {
      imageDeletionErrorDetails = `Could not parse file path from imageUrl: ${imageUrl}. Image not deleted.`;
      console.warn(`[Admin Action] ${imageDeletionErrorDetails}`);
      imageDeletedSuccessfully = false;
    }
  } else {
    imageDeletedSuccessfully = true; 
  }

  try {
    await adminDb.collection('suggestedLocations').doc(suggestionId).delete();
    console.log(`[Admin Action] Successfully deleted Firestore document '${suggestionId}'.`);
    revalidatePath('/admin/suggestions');

    if (!imageUrl || imageUrl.trim() === '') {
      finalMessage = "Suggestion document deleted successfully. No image was associated.";
      finalType = 'success';
    } else if (imageDeletedSuccessfully) {
      if (imageDeletionErrorDetails.includes("not found")) {
        finalMessage = `Suggestion document deleted. Associated image was not found in storage (may have been deleted previously).`;
        finalType = 'info';
      } else {
        finalMessage = "Suggestion and associated image deleted successfully.";
        finalType = 'success';
      }
    } else {
      finalMessage = `Suggestion document deleted. However, the associated image deletion failed: ${imageDeletionErrorDetails || 'Unknown image error.'}`;
      finalType = 'error';
    }
    return { message: finalMessage, type: finalType, suggestionId };

  } catch (firestoreError: any) {
    console.error(`[Admin Action] Failed to delete Firestore document '${suggestionId}':`, firestoreError);
    let message = `Failed to delete suggestion document: ${firestoreError.message}.`;
    if (imageUrl && imageUrl.trim() !== '') {
      if (!imageDeletedSuccessfully && imageDeletionErrorDetails) {
        message += ` Additionally, image deletion failed: ${imageDeletionErrorDetails}`;
      } else if (imageDeletedSuccessfully && imageDeletionErrorDetails.includes("not found")) {
         message += ` Note: Associated image was not found in storage.`;
      }
    }
    return { message, type: 'error', suggestionId };
  }
}

// Schema for adding a comment
const AddCommentSchema = z.object({
  locationId: z.string().min(1, "Location ID is required."),
  userName: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name must be 50 characters or less."),
  commentText: z.string().min(3, "Comment must be at least 3 characters.").max(500, "Comment must be 500 characters or less."),
  suggesterUid: z.string().min(1, "User ID is missing.").nullable().optional(), // For anonymous user tracking
});

export interface AddCommentFormState {
  message: string;
  type: 'success' | 'error' | 'info';
  errors?: Record<string, string[] | undefined>;
  commentId?: string; // ID of the newly added suggested comment
}

const ANONYMOUS_USER_DAILY_COMMENT_LIMIT = 20; 

export async function addCommentToLocation(
  prevState: AddCommentFormState | undefined,
  formData: FormData
): Promise<AddCommentFormState> {
  
  console.log('[Action:addCommentToLocation] Received FormData keys:', Array.from(formData.keys()));

  const rawData = {
    locationId: formData.get('locationId') as string,
    userName: formData.get('userName') as string,
    commentText: formData.get('commentText') as string,
    suggesterUid: formData.get('suggesterUid') as string | null | undefined, // Can be null from formData.get
  };

  console.log('[Action:addCommentToLocation] Raw data for validation:', JSON.stringify(rawData, null, 2));

  const validatedFields = AddCommentSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const validationErrors = validatedFields.error.flatten();
    console.error('[Action:addCommentToLocation] Validation failed. Details:', JSON.stringify(validationErrors, null, 2));
    return {
      message: "Validation failed. Please check your input.",
      type: 'error',
      errors: validationErrors.fieldErrors,
    };
  }

  const { locationId, userName, commentText, suggesterUid } = validatedFields.data;
  console.log('[Action:addCommentToLocation] Validation successful. Data:', JSON.stringify(validatedFields.data, null, 2));

  try {
    // Check daily limit for anonymous users
    if (suggesterUid) { // suggesterUid could be null here if schema is .nullable().optional()
      const dailyLimitCheck = await checkAndIncrementAnonymousUserDailyLimit(
        suggesterUid, // If suggesterUid is null, this might cause issues or needs to be handled by checkAndIncrement...
        ANONYMOUS_USER_DAILY_COMMENT_LIMIT,
        'userDailyCommentLimits', 
        'lastCommentDate' 
      );
      if (!dailyLimitCheck.allowed) {
         console.warn(`[Action:addCommentToLocation] Daily comment limit reached for UID: ${suggesterUid}`);
        return {
          message: dailyLimitCheck.message || "Daily comment limit reached.",
          type: 'error',
        };
      }
    }

    const locationDoc = await getLocationById(locationId);
    if (!locationDoc) {
      console.error(`[Action:addCommentToLocation] Location not found for ID: ${locationId}`);
      return { message: "Location not found.", type: 'error' };
    }
    const locationName = locationDoc.name; 

    const newSuggestedComment: Omit<SuggestedComment, 'id' | 'submittedAt'> = {
      locationId,
      locationName,
      userName,
      commentText,
      status: 'pending',
      submittedAtFirestore: FieldValue.serverTimestamp(),
      ...(suggesterUid && { suggesterUid }), // Only add suggesterUid if it's truthy (not null, not undefined, not empty string)
    };

    console.log('[Action:addCommentToLocation] Attempting to add suggested comment to Firestore:', JSON.stringify(newSuggestedComment, null, 2));
    const newCommentRef = await adminDb.collection('suggestedComments').add(newSuggestedComment);
    console.log(`[Action:addCommentToLocation] Suggested comment added successfully with ID: ${newCommentRef.id}`);
    
    return {
      message: "Thank you! Your comment has been submitted and is now pending review.",
      type: 'success',
      commentId: newCommentRef.id,
    };

  } catch (error: any) {
    console.error("[Action:addCommentToLocation] Error during comment submission process:", error);
    return {
      message: error.message || "Failed to submit comment. Please try again.",
      type: 'error',
    };
  }
}

// Helper function to get a generic user daily limit (can be reused)
// Note: This was refactored into checkAndIncrementAnonymousUserDailyLimit for more specific use.
// Keeping the more generic structure of checkAndIncrementAnonymousUserDailyLimit.


    
