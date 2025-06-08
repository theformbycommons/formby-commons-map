
'use server';

import type { NewLocationSuggestion } from './types';
import { db } from './firebase';
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp
} from 'firebase/firestore';

// Helper to convert Firestore timestamp to ISO string or return existing string
const formatDateField = (dateField: any): string | undefined => {
  if (dateField instanceof Timestamp) {
    return dateField.toDate().toISOString();
  }
  if (typeof dateField === 'string') {
    return dateField;
  }
  // If field is undefined or null, return undefined.
  return undefined; 
};


export async function getSuggestedLocations(): Promise<NewLocationSuggestion[]> {
  try {
    const suggestionsCol = collection(db, 'suggestedLocations');
    // Order by 'submittedAtFirestore' for consistent ordering.
    // If 'submittedAtFirestore' might not exist on all documents, consider ordering by 'submittedAt' (string)
    // or ensure 'submittedAtFirestore' is always present for new suggestions.
    // For now, assuming 'submittedAtFirestore' is generally available for ordering.
    const q = query(suggestionsCol, orderBy('submittedAtFirestore', 'desc'));
    const suggestionSnapshot = await getDocs(q);

    return suggestionSnapshot.docs.map(docSnap => {
      const rawData = docSnap.data();
      
      // Destructure to separate potential Timestamp objects
      const { submittedAtFirestore, approvedAtFirestore, ...restData } = rawData;

      // Use the processed string versions
      const submittedAtString = formatDateField(submittedAtFirestore || rawData.submittedAt);
      const approvedAtString = formatDateField(approvedAtFirestore || rawData.approvedAt);

      // Construct the object for the client, ensuring no raw Timestamp objects are passed
      const clientSafeSuggestion: Omit<NewLocationSuggestion, 'submittedAtFirestore' | 'approvedAtFirestore'> & { id: string } = {
        id: docSnap.id,
        ...restData, // Spread remaining data which should not contain the raw timestamps
        submittedAt: submittedAtString || new Date(0).toISOString(), // Fallback for safety
        approvedAt: approvedAtString, // This can be undefined
        // Ensure all other fields from NewLocationSuggestion are present in restData or explicitly set
        name: restData.name,
        description: restData.description,
        townName: restData.townName,
        category: restData.category,
        suggesterName: restData.suggesterName,
        status: restData.status,
        coordinates: restData.coordinates,
        // Optional fields from restData
        suggesterComment: restData.suggesterComment,
        imageUrl: restData.imageUrl,
        publishedLocationId: restData.publishedLocationId,
      };
      
      return clientSafeSuggestion as NewLocationSuggestion & { id: string };
    });
  } catch (error) {
    console.error("Error fetching suggested locations:", error);
    return [];
  }
}

