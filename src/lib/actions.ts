
'use server';

import { z } from 'zod';
import type { NewLocationSuggestion, Location, FormState as SuggestionFormState } from './types';
import { addDoc, collection, Timestamp, doc, getDoc, runTransaction, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { adminDb, adminStorage } from './firebase-admin';
import { getTownByName } from './data';
import { revalidatePath } from 'next/cache';

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
    const globalQuotaRef = doc(db, 'quotaManagement', 'globalStorage');
    const dailyQuotaRef = doc(db, 'quotaManagement', 'dailyUploads');

    await runTransaction(db, async (transaction) => {
      const globalQuotaDoc = await transaction.get(globalQuotaRef);
      const dailyQuotaDoc = await transaction.get(dailyQuotaDoc);

      if (!globalQuotaDoc.exists() || !dailyQuotaDoc.exists()) {
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

      transaction.update(globalQuotaRef, { totalBytesUsed: totalBytesUsed + dataSizeBytes });
      transaction.update(dailyQuotaRef, { bytesUploadedToday: bytesUploadedToday + dataSizeBytes });
    });

    return { allowed: true };

  } catch (error: any) {
    return { allowed: false, message: error.message || "Failed to verify storage quotas." };
  }
}

export async function submitSuggestion(
  prevState: SuggestionFormState | undefined,
  formData: FormData
): Promise<SuggestionFormState> {

  const suggesterCommentValue = formData.get('suggesterComment');
  const rawFormData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    townName: formData.get('townName') as string,
    category: formData.get('category') as string,
    suggesterName: formData.get('suggesterName') as string,
    suggesterComment: suggesterCommentValue === null || String(suggesterCommentValue).trim() === '' ? undefined : String(suggesterCommentValue),
    imageUrl: formData.get('imageUrl') as string | undefined,
    uploadedImageSize: formData.get('uploadedImageSize') as string | undefined,
    latitude: formData.get('latitude') as string,
    longitude: formData.get('longitude') as string,
  };

  const validatedFields = SuggestionFormSchemaServer.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check the errors below.",
      type: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { latitude, longitude, ...dataToStoreInFirestore } = validatedFields.data;

  const finalDataForFirestore = {
      ...dataToStoreInFirestore,
  };
  delete (finalDataForFirestore as any).uploadedImageSize;


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
      submittedAtFirestore: serverTimestamp(),
      coordinates: {
        lat: latitude,
        lng: longitude,
      },
    };

    const suggestedLocationsCol = collection(db, 'suggestedLocations');
    await addDoc(suggestedLocationsCol, suggestionForDb);

    revalidatePath('/admin/suggestions');

    return {
      message: `Thank you, ${validatedFields.data.suggesterName}! Your suggestion for "${validatedFields.data.name}" has been received${validatedFields.data.imageUrl ? ' with an image' : ''} and is pending review.`,
      type: 'success',
      submittedSuggestionData: {
        ...suggestionForDb,
        submittedAt: new Date().toISOString(),
        submittedAtFirestore: undefined
      } as NewLocationSuggestion,
    };

  } catch (error) {
    let errorMessage = "There was an error submitting your suggestion. Please try again.";
    if (error instanceof Error) {
        if(error.message.includes("Overall storage limit reached") || error.message.includes("Daily upload limit reached") || error.message.includes("Quota configuration documents not found")) {
            errorMessage = error.message;
        }
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
    return { message: "Suggestion ID is missing.", type: 'error' };
  }

  try {
    const suggestionRef = doc(db, 'suggestedLocations', suggestionId);
    const suggestionSnap = await getDoc(suggestionRef);

    if (!suggestionSnap.exists()) {
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

    const batch = writeBatch(db);

    const newLocationRef = doc(collection(db, 'locations'));
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
      createdAtFirestore: serverTimestamp(),
    };
    batch.set(newLocationRef, newLocationData);

    batch.update(suggestionRef, {
      status: 'approved',
      approvedAtFirestore: serverTimestamp(),
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
    console.error("Error approving suggestion:", error);
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
    return null;
  } catch (e) {
    console.error("Error parsing storage URL for deletion:", e, "URL was:", url);
    return null;
  }
}

export async function deleteSuggestion(
  prevState: DeleteSuggestionFormState | undefined,
  formData: FormData
): Promise<DeleteSuggestionFormState> {
  const suggestionId = formData.get('suggestionId') as string;
  const imageUrl = formData.get('imageUrl') as string | undefined;

  let imageDeletedSuccessfully = !imageUrl; // True if no image, otherwise assume false until confirmed
  let imageDeletionErrorDetails = "";

  if (!suggestionId) {
    return { message: "Suggestion ID is missing.", type: 'error', suggestionId };
  }

  // Attempt to delete image first if it exists
  if (imageUrl) {
    const filePath = getPathFromStorageUrl(imageUrl);
    if (filePath) {
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      try {
        if (!bucketName) {
          console.warn(`[Admin Action] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET env variable not set. Attempting to delete image '${filePath}' from default bucket.`);
          await adminStorage.bucket().file(filePath).delete();
        } else {
          console.log(`[Admin Action] Attempting to delete image '${filePath}' from bucket '${bucketName}'.`);
          await adminStorage.bucket(bucketName).file(filePath).delete();
        }
        imageDeletedSuccessfully = true;
        console.log(`[Admin Action] Successfully deleted image '${filePath}' from storage.`);
      } catch (imgErr: any) {
        // Check if the error is "object not found"
        // GCS error for "Not Found" is typically code 404.
        if (imgErr.code === 404 || (imgErr.message && imgErr.message.toLowerCase().includes("no such object"))) {
          imageDeletionErrorDetails = `Image '${filePath}' not found in storage (may have been already deleted or path is incorrect).`;
          console.warn(`[Admin Action] ${imageDeletionErrorDetails}`);
          imageDeletedSuccessfully = true; // Treat as "not an error preventing doc deletion"
        } else {
          imageDeletionErrorDetails = `Failed to delete image '${filePath}': ${imgErr.message}.`;
          console.error(`[Admin Action] ${imageDeletionErrorDetails}`, imgErr);
        }
      }
    } else {
      imageDeletionErrorDetails = `Could not parse file path from imageUrl: ${imageUrl}. Image not deleted.`;
      console.warn(`[Admin Action] ${imageDeletionErrorDetails}`);
    }
  }

  // Attempt to delete Firestore document
  try {
    await adminDb.collection('suggestedLocations').doc(suggestionId).delete();
    console.log(`[Admin Action] Successfully deleted Firestore document '${suggestionId}'.`);
    revalidatePath('/admin/suggestions');

    if (!imageUrl) {
      return { message: "Suggestion document deleted successfully. No image was associated.", type: 'success', suggestionId };
    }
    if (imageDeletedSuccessfully) {
      return { message: "Suggestion and associated image (if any) deleted successfully.", type: 'success', suggestionId };
    }
    // Firestore doc deleted, but image deletion had issues (but not "not found" type errors that we treat as okay)
    return {
      message: `Suggestion document deleted. However, image deletion failed: ${imageDeletionErrorDetails || 'Unknown image error.'}`,
      type: 'info', // Use 'info' as the main operation (doc deletion) succeeded
      suggestionId
    };

  } catch (firestoreError: any) {
    console.error(`[Admin Action] Failed to delete Firestore document '${suggestionId}':`, firestoreError);
    let message = `Failed to delete suggestion document: ${firestoreError.message}.`;
    if (imageUrl && !imageDeletedSuccessfully && imageDeletionErrorDetails) {
      message += ` Additionally, image deletion failed: ${imageDeletionErrorDetails}`;
    }
    return { message, type: 'error', suggestionId };
  }
}
