'use server';

import { z } from 'zod';
import { moderateLocationDescription } from '@/ai/flows/moderate-location-description';
import type { NewLocationSuggestion } from './types';
import { addSuggestedLocation, mockTowns } from './data'; // Using mockTowns for validation

const SuggestionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  townName: z.string().min(2, "Town name is required").max(50),
  category: z.string().min(1, "Category is required"),
  suggesterName: z.string().min(2, "Your name must be at least 2 characters").max(50),
  suggesterComment: z.string().max(500).optional(),
});

export interface FormState {
  message: string;
  type: 'success' | 'error' | 'info';
  errors?: Record<string, string[] | undefined>;
  submittedLocation?: NewLocationSuggestion & { moderationResult?: any };
}

export async function submitSuggestion(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const rawFormData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    townName: formData.get('townName') as string,
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

  const { description, townName, ...restOfData } = validatedFields.data;

  // Step 1: Content Moderation
  try {
    const moderationResult = await moderateLocationDescription({ description });
    if (!moderationResult.isAppropriate) {
      return {
        message: `Submission rejected due to content policy: ${moderationResult.reason || 'Inappropriate content detected.'}`,
        type: 'error',
        submittedLocation: { ...validatedFields.data, moderationResult },
      };
    }
  } catch (error) {
    console.error("Error during content moderation:", error);
    return {
      message: "Could not moderate content at this time. Please try again later.",
      type: 'error',
    };
  }
  
  // Step 2: (Mock) Find Town ID or handle new town. For now, let's assume town exists or is new.
  const existingTown = mockTowns.find(t => t.name.toLowerCase() === townName.toLowerCase());
  // In a real app, you might create a new town entry or associate with an existing one.
  // For this mock, we'll just use the town name as provided.

  // Step 3: (Mock) Save the suggestion
  // In a real app, this data (excluding picture for now) would be saved to a database for review.
  // The picture would be uploaded to storage and its URL saved.
  try {
    const newSuggestionData: Omit<import('./types').Location, 'id' | 'comments' | 'rating'> = {
      ...restOfData,
      description,
      townName, // This would be town.name
      townId: existingTown?.id || `new-town-${townName.toLowerCase().replace(/\s+/g, '-')}`, // Mock townId
      submittedBy: validatedFields.data.suggesterName,
      suggesterComment: validatedFields.data.suggesterComment,
      coordinates: { lat: 0, lng: 0 }, // Placeholder coordinates
      // imageUrl would come from picture upload
    };
    
    const submitted = await addSuggestedLocation(newSuggestionData); // Mock saving

    return {
      message: `Thank you, ${validatedFields.data.suggesterName}! Your suggestion for "${validatedFields.data.name}" for The Local Glow has been received and is pending review.`,
      type: 'success',
      submittedLocation: { ...validatedFields.data, moderationResult: { isAppropriate: true } },
    };

  } catch (error) {
    console.error("Error submitting suggestion:", error);
    return {
      message: "There was an error submitting your suggestion. Please try again.",
      type: 'error',
    };
  }
}
