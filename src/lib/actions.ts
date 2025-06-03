
'use server';

import { z } from 'zod';
import type { NewLocationSuggestion } from './types';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
// Using mockTowns for validation (client-side datalist primarily)
// import { mockTowns } from './data'; // This is only used for client-side datalist now.

const SuggestionSchema = z.object({
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
});

export interface FormState {
  message: string;
  type: 'success' | 'error' | 'info';
  errors?: Record<string, string[] | undefined>;
  submittedSuggestionData?: NewLocationSuggestion; // Store the submitted data for potential display
}

export async function submitSuggestion(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const rawFormData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    townName: formData.get('townName') as string,
    postcodeOutcode: formData.get('postcodeOutcode') as string | undefined,
    category: formData.get('category') as string,
    suggesterName: formData.get('suggesterName') as string,
    suggesterComment: formData.get('suggesterComment') as string | undefined,
    // pictureFile: formData.get('pictureFile') // File handling for storage is a separate step
  };

  const validatedFields = SuggestionSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check the errors below.",
      type: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const dataToSubmit = {
    ...validatedFields.data,
    postcodeOutcode: validatedFields.data.postcodeOutcode === '' ? undefined : validatedFields.data.postcodeOutcode,
  };

  try {
    const suggestionForDb: NewLocationSuggestion = {
      ...dataToSubmit,
      status: 'pending',
      submittedAt: Timestamp.now().toDate().toISOString(), // Store as ISO string
      coordinates: { lat: 0, lng: 0 }, // Placeholder coordinates, actual geocoding/map input needed for real values
      // imageUrl will be added after image upload to Firebase Storage
    };

    const suggestedLocationsCol = collection(db, 'suggestedLocations');
    await addDoc(suggestedLocationsCol, suggestionForDb);

    return {
      message: `Thank you, ${dataToSubmit.suggesterName}! Your suggestion for "${dataToSubmit.name}" has been received and is pending review.`,
      type: 'success',
      submittedSuggestionData: suggestionForDb,
    };

  } catch (error) {
    console.error("Error submitting suggestion to Firestore:", error);
    return {
      message: "There was an error submitting your suggestion. Please try again.",
      type: 'error',
    };
  }
}
