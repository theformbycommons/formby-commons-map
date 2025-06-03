
'use server';

import { z } from 'zod';
// Removed: import { moderateLocationDescription } from '@/ai/flows/moderate-location-description';
import type { NewLocationSuggestion, Location } from './types';
import { addSuggestedLocation, mockTowns } from './data'; // Using mockTowns for validation

const SuggestionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  townName: z.string().min(2, "Town name is required").max(50),
  postcodeOutcode: z.string()
    .regex(/^[A-Za-z0-9]{3,4}$/, "Postcode outcode must be 3 or 4 alphanumeric characters.")
    .transform(val => val.toUpperCase())
    .optional()
    .or(z.literal('')), // Allow empty string to be valid if optional
  category: z.string().min(1, "Category is required"),
  suggesterName: z.string().min(2, "Your name must be at least 2 characters").max(50),
  suggesterComment: z.string().max(500).optional(),
});

export interface FormState {
  message: string;
  type: 'success' | 'error' | 'info';
  errors?: Record<string, string[] | undefined>;
  submittedLocation?: NewLocationSuggestion;
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
    // pictureFile: formData.get('pictureFile') // File handling would be more complex
  };

  const validatedFields = SuggestionSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check the errors below.",
      type: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  // Ensure postcodeOutcode is truly optional (empty string becomes undefined)
  const dataToSubmit = {
    ...validatedFields.data,
    postcodeOutcode: validatedFields.data.postcodeOutcode === '' ? undefined : validatedFields.data.postcodeOutcode,
  };


  const { description, townName, ...restOfData } = dataToSubmit;
  
  const existingTown = mockTowns.find(t => t.name.toLowerCase() === townName.toLowerCase());

  try {
    // Ensure newSuggestionData matches the expected type for addSuggestedLocation
    const newSuggestionData: Omit<Location, 'id' | 'comments'> & { imageUrl?: string } = {
      ...restOfData,
      description,
      townName, 
      townId: existingTown?.id || `new-town-${townName.toLowerCase().replace(/\s+/g, '-')}`,
      submittedBy: dataToSubmit.suggesterName,
      suggesterComment: dataToSubmit.suggesterComment,
      postcodeOutcode: dataToSubmit.postcodeOutcode, // Add postcode here
      coordinates: { lat: 0, lng: 0 }, // Placeholder coordinates
      // imageUrl would come from picture upload
    };
    
    const submitted = await addSuggestedLocation(newSuggestionData);

    return {
      message: `Thank you, ${dataToSubmit.suggesterName}! Your suggestion for "${dataToSubmit.name}" for The Local Glow has been received and is pending review.`,
      type: 'success',
      submittedLocation: { ...dataToSubmit },
    };

  } catch (error) {
    console.error("Error submitting suggestion:", error);
    return {
      message: "There was an error submitting your suggestion. Please try again.",
      type: 'error',
    };
  }
}
