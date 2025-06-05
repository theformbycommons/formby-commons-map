
'use server';

import { z } from 'zod';
import type { NewLocationSuggestion } from './types';
import { addDoc, collection, Timestamp, doc, getDoc, runTransaction, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Zod schema for server-side validation, pictureFile is now the potentially resized file
const SuggestionFormSchemaServer = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  townName: z.string().min(2, "Town name is required").max(50),
  postcodeOutcode: z.string()
    .regex(/^[A-Za-z0-9]{3,4}$/, "Postcode outcode must be 3 or 4 alphanumeric characters.")
    .transform(val => val.toUpperCase())
    .optional()
    .or(z.literal('')),
  category: z.string().min(1, "Category is required"),
  suggesterName: z.string().min(2, "Your name must be at least 2 characters").max(50),
  suggesterComment: z.string().max(500).optional(),
  pictureFile: z // This is the (potentially client-resized) file
    .custom<File | null>((val) => val === null || val instanceof File, "Invalid file input.")
    // Max size for the *processed* file received by server can be smaller, e.g., 500KB, 
    // original 5MB check is on client for user feedback.
    .refine((file) => !file || file.size <= 1 * 1024 * 1024, `Processed image file size too large (max 1MB).`) 
    .refine(
      (file) => !file || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Only .jpg, .png, or .webp formats are supported for processed image.'
    )
    .optional()
    .nullable(),
});

export interface FormState {
  message: string;
  type: 'success' | 'error' | 'info';
  errors?: Record<string, (string[] | undefined)>;
  submittedSuggestionData?: NewLocationSuggestion;
}

// --- Quota Management Logic ---
const DEFAULT_MAX_GLOBAL_BYTES = 1 * 1024 * 1024 * 1024; // 1GB
const DEFAULT_MAX_DAILY_BYTES = 50 * 1024 * 1024; // 50MB
const APPROX_NON_IMAGE_DATA_SIZE = 2 * 1024; // Approx 2KB for text data per submission

async function checkAndIncrementQuotas(dataSizeBytes: number): Promise<{ allowed: boolean; message?: string }> {
  const todayDateString = new Date().toISOString().split('T')[0];

  try {
    // References to quota documents
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
      
      // Reset daily quota if it's a new day
      if (lastResetDate !== todayDateString) {
        bytesUploadedToday = 0;
        transaction.update(dailyQuotaRef, { bytesUploadedToday: 0, lastResetDate: todayDateString });
      }

      // Check global quota
      if (totalBytesUsed + dataSizeBytes > maxBytesAllowed) {
        throw new Error('Overall storage limit reached. We are sorry, but at the moment, the site can\'t accept any new location submissions.');
      }

      // Check daily quota
      if (bytesUploadedToday + dataSizeBytes > maxBytesPerDay) {
        throw new Error('Daily upload limit reached. We are sorry, but at the moment, the site can\'t accept any new location submissions. Please try again tomorrow.');
      }
      
      // If all checks pass, increment quotas
      transaction.update(globalQuotaRef, { totalBytesUsed: totalBytesUsed + dataSizeBytes });
      transaction.update(dailyQuotaRef, { bytesUploadedToday: bytesUploadedToday + dataSizeBytes });
    });
    
    return { allowed: true };

  } catch (error: any) {
    // console.error("Quota check/increment error:", error.message);
    return { allowed: false, message: error.message || "Failed to verify storage quotas." };
  }
}
// --- End Quota Management Logic ---


export async function submitSuggestion(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {

  const rawFormData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    townName: formData.get('townName') as string,
    postcodeOutcode: formData.get('postcodeOutcode') as string || '',
    category: formData.get('category') as string,
    suggesterName: formData.get('suggesterName') as string,
    suggesterComment: formData.get('suggesterComment') as string | undefined,
    pictureFile: (formData.get('pictureFile') as File) || null,
  };

  const validatedFields = SuggestionFormSchemaServer.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check the errors below.",
      type: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { pictureFile, ...dataToStoreInFirestore } = validatedFields.data;
  
  const finalDataForFirestore = {
      ...dataToStoreInFirestore,
      postcodeOutcode: dataToStoreInFirestore.postcodeOutcode === '' ? undefined : dataToStoreInFirestore.postcodeOutcode,
  };

  // --- Quota Check ---
  const dataSizeForQuota = (pictureFile ? pictureFile.size : 0) + APPROX_NON_IMAGE_DATA_SIZE;
  const quotaCheckResult = await checkAndIncrementQuotas(dataSizeForQuota);

  if (!quotaCheckResult.allowed) {
    return {
      message: quotaCheckResult.message || "Submission blocked due to storage quota limits.",
      type: 'error',
    };
  }
  // --- End Quota Check ---

  try {
    let imageUrl: string | undefined = undefined;

    if (pictureFile && pictureFile.size > 0) {
      const safeFileName = pictureFile.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const uniqueFileName = `${Date.now()}-${safeFileName}`;
      const imageRef = ref(storage, `suggested_location_images/${uniqueFileName}`);
      
      const snapshot = await uploadBytes(imageRef, pictureFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const suggestionForDb: NewLocationSuggestion = {
      ...finalDataForFirestore,
      status: 'pending',
      submittedAt: Timestamp.now().toDate().toISOString(), // Consider serverTimestamp() for direct Firestore use
      coordinates: { lat: 0, lng: 0 }, 
      imageUrl: imageUrl, 
    };

    const suggestedLocationsCol = collection(db, 'suggestedLocations');
    await addDoc(suggestedLocationsCol, {
        ...suggestionForDb,
        submittedAtFirestore: serverTimestamp() // Use server timestamp for more reliable timing
    });

    return {
      message: `Thank you, ${validatedFields.data.suggesterName}! Your suggestion for "${validatedFields.data.name}" has been received${imageUrl ? ' with an image' : ''} and is pending review.`,
      type: 'success',
      submittedSuggestionData: { ...suggestionForDb, submittedAt: new Date().toISOString() }, // Return with current ISO string for immediate feedback
    };

  } catch (error) {
    // console.error("Error submitting suggestion:", error);
    // IMPORTANT: If submission fails *after* quota increment, we need to decrement.
    // This is complex. For now, we assume submission will succeed or quota error is caught before.
    // A more robust solution might involve a two-phase commit or background job for quota reconciliation.
    let errorMessage = "There was an error submitting your suggestion. Please try again.";
    if (error instanceof Error) {
        if (error.message.includes('storage/unauthorized')) {
            errorMessage = "Error: You are not authorized to upload files. Please check Firebase Storage security rules."
        } else if (error.message.includes('storage/object-not-found')) {
            errorMessage = "Error: Could not find the storage object after upload. This might be a configuration issue."
        } else {
            // If it's one of our custom quota messages, use that
            if(error.message.includes("Overall storage limit reached") || error.message.includes("Daily upload limit reached") || error.message.includes("Quota configuration documents not found")) {
                errorMessage = error.message;
            }
        }
    }
    return {
      message: errorMessage,
      type: 'error',
    };
  }
}
