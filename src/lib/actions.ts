
'use server';

import { z } from 'zod';
import type { NewLocationSuggestion, Location } from './types';
import { adminDb, adminStorage } from './firebase-admin'; 
import { getTownByName } from './data'; 
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore'; 


// Zod schema for server-side validation (SuggestLocationForm)
const SuggestionFormSchemaServer = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  townName: z.string().min(2, "Town name is required").max(50),
  category: z.string().min(1, "Category is required"),
  suggesterName: z.string().min(2, "Your name must be at least 2 characters").max(50),
  suggesterComment: z.string().max(500, "Comment must be 500 characters or less.").optional(),
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
  submittedSuggestionData?: NewLocationSuggestion;
}

const DEFAULT_MAX_GLOBAL_BYTES = 1 * 1024 * 1024 * 1024; // 1GB
const DEFAULT_MAX_DAILY_BYTES = 50 * 1024 * 1024; // 50MB
const APPROX_NON_IMAGE_DATA_SIZE = 2 * 1024; // Approx 2KB for text data per submission

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

async function checkAndIncrementAnonymousUserDailyLimit(uid: string): Promise<{ allowed: boolean; message?: string }> {
  const todayDateString = new Date().toISOString().split('T')[0];
  const userLimitRef = adminDb.collection('userDailySuggestionLimits').doc(uid);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const userLimitDoc = await transaction.get(userLimitRef);

      if (!userLimitDoc.exists) {
        transaction.set(userLimitRef, {
          count: 1,
          lastSubmissionDate: todayDateString,
        });
        return; 
      }

      const data = userLimitDoc.data()!;
      if (data.lastSubmissionDate !== todayDateString) {
        transaction.update(userLimitRef, {
          count: 1,
          lastSubmissionDate: todayDateString,
        });
        return; 
      }

      if (data.count >= ANONYMOUS_USER_DAILY_SUBMISSION_LIMIT) {
        throw new Error(`You have reached the daily limit of ${ANONYMOUS_USER_DAILY_SUBMISSION_LIMIT} suggestions. Please try again tomorrow.`);
      }

      transaction.update(userLimitRef, { count: FieldValue.increment(1) });
    });
    return { allowed: true };
  } catch (error: any) {
    console.error(`Error checking/incrementing daily limit for UID ${uid}:`, error);
    return { allowed: false, message: error.message || "Failed to verify daily submission limit." };
  }
}


export async function submitSuggestion(
  prevState: SuggestionFormState | undefined,
  formData: FormData
): Promise<SuggestionFormState> {

  const suggesterCommentValue = formData.get('suggesterComment');
  const imageUrlValue = formData.get('imageUrl');
  const uploadedImageSizeValue = formData.get('uploadedImageSize');
  const suggesterUidValue = formData.get('suggesterUid');

  const rawFormData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    townName: formData.get('townName') as string,
    category: formData.get('category') as string,
    suggesterName: formData.get('suggesterName') as string,
    suggesterComment: suggesterCommentValue === null || String(suggesterCommentValue).trim() === '' ? undefined : String(suggesterCommentValue),
    imageUrl: imageUrlValue === null ? undefined : String(imageUrlValue), // map null to undefined for optional URL
    uploadedImageSize: uploadedImageSizeValue === null ? undefined : String(uploadedImageSizeValue), // map null to undefined
    latitude: formData.get('latitude') as string,
    longitude: formData.get('longitude') as string,
    suggesterUid: suggesterUidValue === null ? undefined : String(suggesterUidValue), // map null to undefined for optional UID
  };

  const validatedFields = SuggestionFormSchemaServer.safeParse(rawFormData);

  if (!validatedFields.success) {
    const flatErrors = validatedFields.error.flatten();
    let detailedErrorMessage = "Validation failed. Details: ";
    // Append field errors
    for (const [field, messages] of Object.entries(flatErrors.fieldErrors)) {
        if (messages) detailedErrorMessage += `${field}: ${messages.join(', ')}; `;
    }
    // Append form errors (if any)
    if (flatErrors.formErrors.length > 0) {
        detailedErrorMessage += `Form errors: ${flatErrors.formErrors.join(', ')}; `;
    }
    
    // This console.error is for server-side logs if available/checked
    console.error("Server-side validation errors:", flatErrors); 
    
    return {
      message: detailedErrorMessage.length > "Validation failed. Details: ".length ? detailedErrorMessage : "Validation failed. Please check form fields.",
      type: 'error',
      errors: flatErrors.fieldErrors,
    };
  }

  const { latitude, longitude, suggesterUid, ...dataToStoreInFirestore } = validatedFields.data;

  if (suggesterUid) {
    const dailyLimitCheck = await checkAndIncrementAnonymousUserDailyLimit(suggesterUid);
    if (!dailyLimitCheck.allowed) {
      return {
        message: dailyLimitCheck.message || "Daily submission limit reached.",
        type: 'error',
      };
    }
  }
  
  const finalDataForFirestore = {
      ...dataToStoreInFirestore,
  };
  // uploadedImageSize is only used for quota calculation, not stored in Firestore
  delete (finalDataForFirestore as any).uploadedImageSize; 
  // Ensure imageUrl is null if it was undefined (Zod optional turns undefined into actual undefined)
  if (finalDataForFirestore.imageUrl === undefined) {
    (finalDataForFirestore as any).imageUrl = null;
  }


  const dataSizeForQuota = (validatedFields.data.uploadedImageSize || 0) + APPROX_NON_IMAGE_DATA_SIZE;
  const quotaCheckResult = await checkAndIncrementQuotas(dataSizeForQuota);

  if (!quotaCheckResult.allowed) {
    return {
      message: quotaCheckResult.message || "Submission blocked due to storage quota limits.",
      type: 'error',
    };
  }

  try {
    const suggestionForDb: Omit<NewLocationSuggestion, 'id' | 'submittedAt' | 'status'> & { status: 'pending', submittedAtFirestore: any } = {
      ...finalDataForFirestore,
      status: 'pending',
      submittedAtFirestore: FieldValue.serverTimestamp(), 
      coordinates: {
        lat: latitude,
        lng: longitude,
      },
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
        submittedAt: new Date().toISOString(), 
        submittedAtFirestore: undefined 
      } as NewLocationSuggestion,
    };

  } catch (error) {
    let errorMessage = "There was an error submitting your suggestion. Please try again.";
    if (error instanceof Error) {
        if(error.message.includes("Overall storage limit reached") || 
           error.message.includes("Daily upload limit reached") || 
           error.message.includes("Quota configuration documents not found") ||
           error.message.includes("daily limit of")) { 
            errorMessage = error.message;
        }
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
      imageUrl: suggestionData.imageUrl,
      category: suggestionData.category,
      coordinates: suggestionData.coordinates,
      submittedBy: suggestionData.suggesterName,
      suggesterComment: suggestionData.suggesterComment,
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

    return {
      message: `Suggestion "${suggestionData.name}" approved and published successfully!`,
      type: 'success',
      suggestionId
    };

  } catch (error) {
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
    // Pathname for GCS URLs typically looks like: /v0/b/your-bucket-name.appspot.com/o/path%2Fto%2Fyour%2Ffile.jpg
    const pathSegments = urlObj.pathname.split('/o/');
    if (pathSegments.length > 1) {
      // The actual file path within the bucket is after '/o/' and needs to be URL-decoded
      const encodedPath = pathSegments[1].split('?')[0]; // Remove query params like alt=media&token=...
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
  const imageUrl = formData.get('imageUrl') as string | undefined | null; // Can be null from form

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
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET; // Ensure this is set
      const bucket = bucketName ? adminStorage.bucket(bucketName) : adminStorage.bucket(); // Default bucket if not specified
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
          imageDeletedSuccessfully = true; // Treat as success if file not found, as desired state is "not there"
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
     // No image URL provided or it's empty, so image deletion is trivially successful or not applicable
    imageDeletedSuccessfully = true;
  }

  try {
    await adminDb.collection('suggestedLocations').doc(suggestionId).delete();
    console.log(`[Admin Action] Successfully deleted Firestore document '${suggestionId}'.`);
    revalidatePath('/admin/suggestions');

    if (!imageUrl || imageUrl.trim() === '') { // No image was associated
      finalMessage = "Suggestion document deleted successfully. No image was associated.";
      finalType = 'success';
    } else if (imageDeletedSuccessfully) {
      if (imageDeletionErrorDetails.includes("not found")) { // Image was specified but not found
        finalMessage = `Suggestion document deleted. Associated image was not found in storage (may have been deleted previously).`;
        finalType = 'info';
      } else { // Image was specified and successfully deleted
        finalMessage = "Suggestion and associated image deleted successfully.";
        finalType = 'success';
      }
    } else { // Image was specified but deletion failed
      finalMessage = `Suggestion document deleted. However, the associated image deletion failed: ${imageDeletionErrorDetails || 'Unknown image error.'}`;
      finalType = 'error'; // More accurately an error or partial success
    }
    return { message: finalMessage, type: finalType, suggestionId };

  } catch (firestoreError: any) {
    console.error(`[Admin Action] Failed to delete Firestore document '${suggestionId}':`, firestoreError);
    let message = `Failed to delete suggestion document: ${firestoreError.message}.`;
    if (imageUrl && imageUrl.trim() !== '') { // If there was an attempt to delete an image
      if (!imageDeletedSuccessfully && imageDeletionErrorDetails) {
        message += ` Additionally, image deletion failed: ${imageDeletionErrorDetails}`;
      } else if (imageDeletedSuccessfully && imageDeletionErrorDetails.includes("not found")) {
         message += ` Note: Associated image was not found in storage.`;
      }
    }
    return { message, type: 'error', suggestionId };
  }
}
