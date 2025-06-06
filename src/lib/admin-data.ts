
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
const formatDateField = (dateField: any): string => {
  if (dateField instanceof Timestamp) {
    return dateField.toDate().toISOString();
  }
  if (typeof dateField === 'string') {
    return dateField;
  }
  // Fallback for unexpected types or if submittedAtFirestore is not set yet
  return new Date(0).toISOString(); 
};


export async function getSuggestedLocations(): Promise<NewLocationSuggestion[]> {
  try {
    const suggestionsCol = collection(db, 'suggestedLocations');
    // Order by 'submittedAtFirestore' if you want the newest/oldest first.
    // Using 'submittedAtFirestore' which is set by serverTimestamp() ensures correct ordering.
    const q = query(suggestionsCol, orderBy('submittedAtFirestore', 'desc'));
    const suggestionSnapshot = await getDocs(q);

    return suggestionSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      // Ensure submittedAt is correctly formatted from submittedAtFirestore or existing submittedAt
      const submittedAt = data.submittedAtFirestore 
        ? formatDateField(data.submittedAtFirestore) 
        : formatDateField(data.submittedAt);

      return {
        id: docSnap.id, // Include the document ID
        ...data,
        submittedAt, // Ensure this is an ISO string
        // Cast to NewLocationSuggestion, assuming data structure matches
      } as NewLocationSuggestion & { id: string }; 
    });
  } catch (error) {
    console.error("Error fetching suggested locations:", error);
    return [];
  }
}
