
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
  // For submittedAt, it should always exist, but for approvedAt, it's optional.
  return undefined; 
};


export async function getSuggestedLocations(): Promise<NewLocationSuggestion[]> {
  try {
    const suggestionsCol = collection(db, 'suggestedLocations');
    // Order by 'submittedAtFirestore' for consistent ordering.
    const q = query(suggestionsCol, orderBy('submittedAtFirestore', 'desc'));
    const suggestionSnapshot = await getDocs(q);

    return suggestionSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      // Ensure submittedAt is correctly formatted from submittedAtFirestore or existing submittedAt
      // It's important that submittedAt is always a string.
      const submittedAt = data.submittedAtFirestore 
        ? formatDateField(data.submittedAtFirestore)
        : formatDateField(data.submittedAt);
      
      if (!submittedAt) {
        // This case should ideally not happen if submittedAtFirestore is always set.
        // Log an error or handle as appropriate if submittedAt is crucial and missing.
        console.warn(`Suggestion ${docSnap.id} is missing a valid submittedAt date.`);
      }

      const approvedAt = data.approvedAtFirestore
        ? formatDateField(data.approvedAtFirestore)
        : formatDateField(data.approvedAt);

      return {
        id: docSnap.id, // Include the document ID
        ...data,
        submittedAt: submittedAt || new Date(0).toISOString(), // Fallback if submittedAt was somehow null/undefined
        approvedAt: approvedAt, // This can be undefined if not approved
        // Cast to NewLocationSuggestion, assuming data structure matches
      } as NewLocationSuggestion & { id: string }; 
    });
  } catch (error) {
    console.error("Error fetching suggested locations:", error);
    return [];
  }
}
