
'use server';

import { z } from 'zod';
import type { NewLocationSuggestion } from './types';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db, storage } from './firebase'; // Added storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Added Firebase Storage functions

// Zod schema for server-side validation, including the picture file
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
  pictureFile: z
    .custom<File | null>((val) => val === null || val instanceof File, "Invalid file input.")
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, `Max file size is 5MB.`)
    .refine(
      (file) => !file || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Only .jpg, .png, or .webp formats are supported.'
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

export async function submitSuggestion(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {

  const rawFormData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    townName: formData.get('townName') as string,
    postcodeOutcode: formData.get('postcodeOutcode') as string || '', // Ensure empty string if undefined
    category: formData.get('category') as string,
    suggesterName: formData.get('suggesterName') as string,
    suggesterComment: formData.get('suggesterComment') as string | undefined,
    pictureFile: (formData.get('pictureFile') as File) || null, // Get File or null
  };

  const validatedFields = SuggestionFormSchemaServer.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check the errors below.",
      type: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  // Exclude pictureFile from dataToSubmit initially, as we only store its URL
  const { pictureFile, ...dataToStoreInFirestore } = validatedFields.data;
  
  // Ensure postcodeOutcode is undefined if it was an empty string after validation, to match type
  const finalDataForFirestore = {
      ...dataToStoreInFirestore,
      postcodeOutcode: dataToStoreInFirestore.postcodeOutcode === '' ? undefined : dataToStoreInFirestore.postcodeOutcode,
  };


  try {
    let imageUrl: string | undefined = undefined;

    if (pictureFile && pictureFile.size > 0) {
      // Sanitize filename (basic example)
      const safeFileName = pictureFile.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const uniqueFileName = `${Date.now()}-${safeFileName}`;
      const imageRef = ref(storage, `suggested_location_images/${uniqueFileName}`);
      
      // Upload the file
      const snapshot = await uploadBytes(imageRef, pictureFile);
      // Get the download URL
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const suggestionForDb: NewLocationSuggestion = {
      ...finalDataForFirestore, // Use the data that has pictureFile excluded
      status: 'pending',
      submittedAt: Timestamp.now().toDate().toISOString(),
      coordinates: { lat: 0, lng: 0 }, // Placeholder
      imageUrl: imageUrl, // Add the imageUrl if upload was successful
    };

    const suggestedLocationsCol = collection(db, 'suggestedLocations');
    await addDoc(suggestedLocationsCol, suggestionForDb);

    return {
      message: `Thank you, ${validatedFields.data.suggesterName}! Your suggestion for "${validatedFields.data.name}" has been received${imageUrl ? ' with an image' : ''} and is pending review.`,
      type: 'success',
      submittedSuggestionData: suggestionForDb,
    };

  } catch (error) {
    console.error("Error submitting suggestion:", error);
    let errorMessage = "There was an error submitting your suggestion. Please try again.";
    if (error instanceof Error && error.message.includes('storage/unauthorized')) {
        errorMessage = "Error: You are not authorized to upload files. Please check Firebase Storage security rules."
    } else if (error instanceof Error && error.message.includes('storage/object-not-found')) {
        errorMessage = "Error: Could not find the storage object after upload. This might be a configuration issue."
    }
    return {
      message: errorMessage,
      type: 'error',
    };
  }
}
