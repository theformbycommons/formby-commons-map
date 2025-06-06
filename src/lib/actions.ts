
'use server';

import { z } from 'zod';
import type { NewLocationSuggestion } from './types';
import { addDoc, collection, Timestamp, doc, getDoc, runTransaction, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// Zod schema for server-side validation
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

export interface FormState {
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
    return { allowed: false, message: error.message || "Failed to verify storage quotas." };
  }
}

export async function submitSuggestion(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {

  const suggesterCommentRaw = formData.get('suggesterComment');
  const processedSuggesterComment = 
    (suggesterCommentRaw === null || (typeof suggesterCommentRaw === 'string' && suggesterCommentRaw.trim() === ''))
    ? undefined
    : String(suggesterCommentRaw);

  const rawFormData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    townName: formData.get('townName') as string,
    category: formData.get('category') as string,
    suggesterName: formData.get('suggesterName') as string,
    suggesterComment: processedSuggesterComment, // Use the processed value
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
    const suggestionForDb: NewLocationSuggestion = {
      ...finalDataForFirestore, 
      status: 'pending',
      submittedAt: Timestamp.now().toDate().toISOString(),
      coordinates: { 
        lat: latitude,
        lng: longitude,
      },
    };

    const suggestedLocationsCol = collection(db, 'suggestedLocations');
    await addDoc(suggestedLocationsCol, {
        ...suggestionForDb,
        submittedAtFirestore: serverTimestamp()
    });

    return {
      message: `Thank you, ${validatedFields.data.suggesterName}! Your suggestion for "${validatedFields.data.name}" has been received${validatedFields.data.imageUrl ? ' with an image' : ''} and is pending review.`,
      type: 'success',
      submittedSuggestionData: { ...suggestionForDb, submittedAt: new Date().toISOString() },
    };

  } catch (error) {
    let errorMessage = "There was an error submitting your suggestion. Please try again.";
    if (error instanceof Error) {
        if(error.message.includes("Overall storage limit reached") || error.message.includes("Daily upload limit reached") || error.message.includes("Quota configuration documents not found")) {
            errorMessage = error.message;
        }
    }
    return {
      message: errorMessage,
      type: 'error',
    };
  }
}
