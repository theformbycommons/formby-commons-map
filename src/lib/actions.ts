
'use server';

import { z } from 'zod';
import type { NewLocationSuggestion, Location, FormState as SuggestionFormState } from './types';
import { addDoc, collection, Timestamp, doc, getDoc, runTransaction, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase'; // Client SDK (db)
import { adminDb, adminStorage } from './firebase-admin'; // Admin SDK (adminDb, adminStorage)
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
    const globalQuotaRef = adminDb.collection('quotaManagement').doc('globalStorage');
    const dailyQuotaRef = adminDb.collection('quotaManagement').doc('dailyUploads');

    await adminDb.runTransaction(async (transaction) => {
      const globalQuotaDoc = await transaction.get(globalQuotaRef);
      const dailyQuotaDoc = await transaction.get(dailyQuotaRef);

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
    console.error("Error in checkAndIncrementQuotas (using adminDb):", error);
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
      submittedAtFirestore: adminDb.FieldValue.serverTimestamp(), // Use Admin SDK serverTimestamp
      coordinates: {
        lat: latitude,
        lng: longitude,
      },
    };

    const suggestedLocationsCol = adminDb.collection('suggestedLocations'); // Use adminDb
    const newDocRef = await suggestedLocationsCol.add(suggestionForDb);

    revalidatePath('/admin/suggestions');

    return {
      message: `Thank you, ${validatedFields.data.suggesterName}! Your suggestion for "${validatedFields.data.name}" has been received${validatedFields.data.imageUrl ? ' with an image' : ''} and is pending review.`,
      type: 'success',
      submittedSuggestionData: {
        id: newDocRef.id, // Include the new document ID
        ...suggestionForDb,
        submittedAt: new Date().toISOString(), // For client-side display if needed immediately
        submittedAtFirestore: undefined // Remove Firestore specific field for client
      } as NewLocationSuggestion,
    };

  } catch (error) {
    let errorMessage = "There was an error submitting your suggestion. Please try again.";
    if (error instanceof Error) {
        if(error.message.includes("Overall storage limit reached") || error.message.includes("Daily upload limit reached") || error.message.includes("Quota configuration documents not found")) {
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
    const suggestionRef = adminDb.collection('suggestedLocations').doc(suggestionId); // Use adminDb
    const suggestionSnap = await suggestionRef.get();

    if (!suggestionSnap.exists) {
      return { message: "Suggestion not found.", type: 'error', suggestionId };
    }

    const suggestionData = suggestionSnap.data() as NewLocationSuggestion;

    if (suggestionData.status !== 'pending') {
      return { message: `Suggestion is already ${suggestionData.status}.`, type: 'info', suggestionId };
    }

    const town = await getTownByName(suggestionData.townName); // getTownByName uses client 'db', might need adjustment if rules are strict. For reads, usually fine.
    if (!town) {
      return {
        message: `Town "${suggestionData.townName}" not found. Please create the town in the 'towns' collection first before approving this suggestion.`,
        type: 'error',
        suggestionId
      };
    }

    const batch = adminDb.batch(); // Use adminDb batch

    const newLocationRef = adminDb.collection('locations').doc(); // Use adminDb
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
      createdAtFirestore: adminDb.FieldValue.serverTimestamp(), // Use Admin SDK serverTimestamp
    };
    batch.set(newLocationRef, newLocationData);

    batch.update(suggestionRef, {
      status: 'approved',
      approvedAtFirestore: adminDb.FieldValue.serverTimestamp(), // Use Admin SDK serverTimestamp
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

  let imageDeletedSuccessfully = !imageUrl; 
  let imageDeletionErrorDetails = "";

  if (!suggestionId) {
    return { message: "Suggestion ID is missing.", type: 'error', suggestionId };
  }

  if (imageUrl) {
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
        }
      }
    } else {
      imageDeletionErrorDetails = `Could not parse file path from imageUrl: ${imageUrl}. Image not deleted.`;
      console.warn(`[Admin Action] ${imageDeletionErrorDetails}`);
    }
  }

  try {
    await adminDb.collection('suggestedLocations').doc(suggestionId).delete();
    console.log(`[Admin Action] Successfully deleted Firestore document '${suggestionId}'.`);
    revalidatePath('/admin/suggestions');

    if (!imageUrl) {
      return { message: "Suggestion document deleted successfully. No image was associated.", type: 'success', suggestionId };
    }
    if (imageDeletedSuccessfully && !imageDeletionErrorDetails) { // Ensure no misleading message if "not found" was the case
      return { message: "Suggestion and associated image deleted successfully.", type: 'success', suggestionId };
    }
     if (imageDeletedSuccessfully && imageDeletionErrorDetails.includes("not found")) {
      return { message: `Suggestion document deleted. ${imageDeletionErrorDetails}`, type: 'info', suggestionId };
    }
    return {
      message: `Suggestion document deleted. However, image deletion failed: ${imageDeletionErrorDetails || 'Unknown image error.'}`,
      type: 'info',
      suggestionId
    };

  } catch (firestoreError: any) {
    console.error(`[Admin Action] Failed to delete Firestore document '${suggestionId}':`, firestoreError);
    let message = `Failed to delete suggestion document: ${firestoreError.message}.`;
    if (imageUrl && !imageDeletedSuccessfully && imageDeletionErrorDetails) {
      message += ` Additionally, image deletion failed: ${imageDeletionErrorDetails}`;
    } else if (imageUrl && imageDeletedSuccessfully && imageDeletionErrorDetails.includes("not found")) {
       message += ` Note: ${imageDeletionErrorDetails}`;
    }
    return { message, type: 'error', suggestionId };
  }
}

