
'use server';

import { z } from 'zod';
import type { NewLocationSuggestion, Location, SuggestedComment, Town } from './types';
import { adminDb, adminStorage } from './firebase-admin';
import { FieldValue as AdminFieldValue } from 'firebase-admin/firestore'; // Corrected import
import { revalidatePath } from 'next/cache';

// Zod schema for server-side validation (SuggestLocationForm)
const SuggestionFormSchemaServer = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  townName: z.string().min(2, "Town name is required").max(50),
  category: z.string().min(1, "Category is required"),
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
  suggesterName: z.string().min(2, "Your name must be at least 2 characters").max(50),
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
    // Using compat API for quota transaction
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

      transaction.update(globalQuotaRef, { totalBytesUsed: AdminFieldValue.increment(dataSizeBytes) });
      transaction.update(dailyQuotaRef, { bytesUploadedToday: AdminFieldValue.increment(dataSizeBytes) });
    });

    return { allowed: true };

  } catch (error: any) {
    console.error("Error in checkAndIncrementQuotas:", error);
    return { allowed: false, message: error.message || "Failed to verify storage quotas." };
  }
}

const ANONYMOUS_USER_DAILY_SUBMISSION_LIMIT = 10;

async function checkAndIncrementAnonymousUserDailyLimit(uid: string, limit: number, collectionNamePath: string, dateFieldName: string, countFieldName: string = 'count'): Promise<{ allowed: boolean; message?: string }> {
  const todayDateString = new Date().toISOString().split('T')[0];
  // Using compat API
  const userLimitRef = adminDb.collection(collectionNamePath).doc(uid);

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

      transaction.update(userLimitRef, { [countFieldName]: AdminFieldValue.increment(1) });
    });
    return { allowed: true };
  } catch (error: any)
{
    console.error(`Error checking/incrementing daily limit for UID ${uid} in ${collectionNamePath}:`, error);
    return { allowed: false, message: error.message || `Failed to verify daily submission limit for this action.` };
  }
}


export async function submitSuggestion(
  prevState: SuggestionFormState | undefined,
  formData: FormData
): Promise<SuggestionFormState> {

  const uploadedImageSizeValue = formData.get('uploadedImageSize');

  const rawFormData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    townName: formData.get('townName') as string,
    category: formData.get('category') as string,
    suggesterName: formData.get('suggesterName') as string,
    uploadedImageSize: uploadedImageSizeValue === null || String(uploadedImageSizeValue).trim() === '' ? undefined : String(uploadedImageSizeValue),
    latitude: formData.get('latitude') as string,
    longitude: formData.get('longitude') as string,
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

    const dataSizeForQuota = APPROX_NON_IMAGE_DATA_SIZE;
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
      imageUrl: null, // Image upload removed
      status: 'pending' as const,
      submittedAtFirestore: AdminFieldValue.serverTimestamp(),
      coordinates: {
        lat: latitude,
        lng: longitude,
      },
      ...(suggesterUid && { suggesterUid }),
    };

    const suggestedLocationsColRef = adminDb.collection('suggestedLocations');
    const newDocRef = await suggestedLocationsColRef.add(suggestionForDb);

    revalidatePath('/admin/suggestions');

    return {
      message: `Thank you, ${validatedFields.data.suggesterName}! Your suggestion for "${validatedFields.data.name}" has been received and is pending review.`,\n
      type: 'success',
      submittedSuggestionData: {
        id: newDocRef.id,
        ...suggestionForDb,
        submittedAt: new Date().toISOString(), 
      } as unknown as NewLocationSuggestion,
    };

  } catch (error: any) {
    let errorMessage = "There was an error submitting your suggestion. Please try again.";
    if (error instanceof Error && error.message) {
      errorMessage = `Error: ${error.message}`;
    } else if (typeof error === 'string') {
      errorMessage = `Error: ${error}`;
    }
    console.error("Error in submitSuggestion action:", error);
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
    return { message: "Suggestion ID is missing.", type: 'error', suggestionId };
  }

  try {
    const suggestionRef = adminDb.collection('suggestedLocations').doc(suggestionId);
    const suggestionSnap = await suggestionRef.get();

    if (!suggestionSnap.exists) {
      return { message: "Suggestion not found.", type: 'error', suggestionId };
    }
    const suggestionData = suggestionSnap.data() as NewLocationSuggestion;

    if (suggestionData.status === 'rejected') {
      return { message: `Suggestion "${suggestionData.name}" has been rejected and cannot be published.`, type: 'info', suggestionId };
    }
    
    if (suggestionData.status === 'approved' && suggestionData.publishedLocationId) {
      // Still revalidate paths in case this is a re-approval to refresh cache after manual DB changes
      revalidatePath('/admin/suggestions');
      revalidatePath(`/town/${encodeURIComponent(suggestionData.townName)}`);
      if (suggestionData.publishedLocationId) {
        revalidatePath(`/location/${suggestionData.publishedLocationId}`);
      }
      revalidatePath('/');
      return { message: `Suggestion "${suggestionData.name}" is already approved and published with ID: ${suggestionData.publishedLocationId}. Paths revalidated.`, type: 'info', suggestionId };
    }
    
    const townsColRef = adminDb.collection('towns');
    // Using compat API for query
    const townQuery = townsColRef.where('name', '==', suggestionData.townName);
    const townQuerySnapshot = await townQuery.get();

    let townId: string;
    let townDataForLocation: Pick<Town, 'id' | 'name' | 'county' | 'country' | 'coordinates' | 'description' | 'imageUrl'>;

    if (townQuerySnapshot.empty) {
      return { 
        message: `Town '${suggestionData.townName}' not found. Please create it manually in the 'towns' collection in Firestore (with all required fields: name, county, country, coordinates, description, imageUrl (optional)) before approving this suggestion. Ensure the 'name' field exactly matches '${suggestionData.townName}'.`, 
        type: 'error', 
        suggestionId 
      };
    } else {
      const existingTownDoc = townQuerySnapshot.docs[0];
      townId = existingTownDoc.id;
      const data = existingTownDoc.data();
      townDataForLocation = {
        id: existingTownDoc.id,
        name: data.name,
        county: data.county,
        country: data.country,
        coordinates: data.coordinates,
        description: data.description,
        imageUrl: data.imageUrl,
      };
    }

    let publishedLocationId: string | undefined = suggestionData.publishedLocationId;

    await adminDb.runTransaction(async (transaction) => {
      const transSuggestionSnap = await transaction.get(suggestionRef); 
      if (!transSuggestionSnap.exists) {
        throw new Error("Suggestion not found within transaction.");
      }
      const currentSuggestionData = transSuggestionSnap.data() as NewLocationSuggestion;
      
      if (currentSuggestionData.status === 'pending' || (currentSuggestionData.status === 'approved' && !currentSuggestionData.publishedLocationId)) {
          if (!currentSuggestionData.publishedLocationId) {
            const newLocationRef = adminDb.collection('locations').doc(); 
            publishedLocationId = newLocationRef.id;

            const newLocationData: Omit<Location, 'id' | 'comments' | 'createdAt'> = {
              townId: townId,
              townName: townDataForLocation.name, 
              name: suggestionData.name,
              description: suggestionData.description,
              imageUrl: suggestionData.imageUrl || null,
              category: suggestionData.category,
              coordinates: suggestionData.coordinates,
              submittedBy: suggestionData.suggesterName,
              createdAtFirestore: AdminFieldValue.serverTimestamp(),
            };
            transaction.set(newLocationRef, { ...newLocationData, comments: [] }); 
          } else {
            publishedLocationId = currentSuggestionData.publishedLocationId; 
          }

          transaction.update(suggestionRef, {
            status: 'approved',
            approvedAtFirestore: AdminFieldValue.serverTimestamp(),
            publishedLocationId: publishedLocationId,
          });
      } else if (currentSuggestionData.status === 'approved' && currentSuggestionData.publishedLocationId) {
         // If it was already fully approved, just ensure timestamp is set (idempotent update)
         // and use existing publishedLocationId
         publishedLocationId = currentSuggestionData.publishedLocationId;
         transaction.update(suggestionRef, {
            approvedAtFirestore: AdminFieldValue.serverTimestamp(), // Update timestamp if re-approving
         });
      } else if (currentSuggestionData.status === 'rejected') {
        throw new Error(`Suggestion status changed to 'rejected' during processing. It may have been processed by another administrator.`);
      }
    });

    revalidatePath('/admin/suggestions');
    revalidatePath(`/town/${encodeURIComponent(suggestionData.townName)}`);
    if (publishedLocationId) {
        revalidatePath(`/location/${publishedLocationId}`);
    }
    revalidatePath('/'); 

    return {
      message: `Suggestion "${suggestionData.name}" for ${suggestionData.townName} successfully processed. Location ID: ${publishedLocationId}.`,
      type: 'success',
      suggestionId
    };

  } catch (error: any) {
    console.error("Error in approveSuggestion action (compat API):", error);
    let errorMessage = "Failed to approve and publish suggestion.";
     if (error instanceof Error && error.message) {
      errorMessage = `Error: ${error.message}`;
    } else {
      errorMessage = `Error: An unknown error occurred. Raw error: ${String(error)}`;
    }
    return {
      message: errorMessage,
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
    // Using compat API for delete
    const suggestionDocRef = adminDb.collection('suggestedLocations').doc(suggestionId); 
    await suggestionDocRef.delete(); 
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

const AddCommentSchema = z.object({
  locationId: z.string().min(1, "Location ID is required."),
  userName: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name must be 50 characters or less."),
  commentText: z.string().min(3, "Comment must be at least 3 characters.").max(500, "Comment must be 500 characters or less."),
  suggesterUid: z.string().min(1, "User ID is missing.").nullable().optional(),
});

export interface AddCommentFormState {
  message: string;
  type: 'success' | 'error' | 'info';
  errors?: Record<string, string[] | undefined>;
  commentId?: string;
}

const ANONYMOUS_USER_DAILY_COMMENT_LIMIT = 20;

export async function addCommentToLocation(
  prevState: AddCommentFormState | undefined,
  formData: FormData
): Promise<AddCommentFormState> {
  const rawData = {
    locationId: formData.get('locationId') as string,
    userName: formData.get('userName') as string,
    commentText: formData.get('commentText') as string,
    suggesterUid: formData.get('suggesterUid') as string | null | undefined,
  };
  const validatedFields = AddCommentSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const validationErrors = validatedFields.error.flatten();
    return {
      message: "Validation failed. Please check your input.",
      type: 'error',
      errors: validationErrors.fieldErrors,
    };
  }

  const { locationId, userName, commentText, suggesterUid } = validatedFields.data;

  try {
    if (suggesterUid) {
      const dailyLimitCheck = await checkAndIncrementAnonymousUserDailyLimit(
        suggesterUid,
        ANONYMOUS_USER_DAILY_COMMENT_LIMIT,
        'userDailyCommentLimits',
        'lastCommentDate'
      );
      if (!dailyLimitCheck.allowed) {
        return {
          message: dailyLimitCheck.message || "Daily comment limit reached.",
          type: 'error',
        };
      }
    }

    // Using compat API
    const locationDataDocRef = adminDb.collection('locations').doc(locationId); 
    const locationDataDocSnap = await locationDataDocRef.get(); 
    if (!locationDataDocSnap.exists) {
      return { message: "Location not found.", type: 'error' };
    }
    const locationName = locationDataDocSnap.data()?.name || "Unknown Location";

    const newSuggestedComment: Omit<SuggestedComment, 'id' | 'submittedAt'> = {
      locationId,
      locationName,
      userName,
      commentText,
      status: 'pending',
      submittedAtFirestore: AdminFieldValue.serverTimestamp(),
      ...(suggesterUid && { suggesterUid }),
    };

    // Using compat API
    const suggestedCommentsColRef = adminDb.collection('suggestedComments'); 
    const newCommentRef = await suggestedCommentsColRef.add(newSuggestedComment); 

    revalidatePath(`/location/${locationId}`);

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
    
