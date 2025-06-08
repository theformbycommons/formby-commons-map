
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

// Helper to convert Firestore timestamp to ISO string or return existing string/undefined
const formatDateField = (dateField: any): string | undefined => {
  if (dateField instanceof Timestamp) {
    return dateField.toDate().toISOString();
  }
  if (typeof dateField === 'string') {
    // Check if it's already an ISO string, otherwise, it might be an invalid date string
    // For simplicity, we'll assume valid strings are already ISO or can be handled by new Date()
    // A more robust check might be needed if various string date formats are possible
    try {
      new Date(dateField).toISOString(); // Check if it's a valid date string
      return dateField;
    } catch (e) {
      return undefined; // Invalid date string
    }
  }
  // If field is undefined or null, or any other type, return undefined.
  return undefined; 
};


export async function getSuggestedLocations(): Promise<NewLocationSuggestion[]> {
  try {
    const suggestionsCol = collection(db, 'suggestedLocations');
    // Order by 'submittedAtFirestore' if it exists, otherwise by 'submittedAt' (string)
    // This assumes 'submittedAtFirestore' is the primary timestamp for sorting.
    // If 'submittedAtFirestore' might not always exist, a more complex query or client-side sort might be needed.
    // For now, let's assume 'submittedAtFirestore' is generally reliable for ordering.
    const q = query(suggestionsCol, orderBy('submittedAtFirestore', 'desc'));
    const suggestionSnapshot = await getDocs(q);

    return suggestionSnapshot.docs.map(docSnap => {
      const data = docSnap.data();

      // Process dates: prefer ...Firestore fields if they are Timestamps, otherwise fallback to string fields
      const submittedAtString = formatDateField(data.submittedAtFirestore) || formatDateField(data.submittedAt) || new Date(0).toISOString();
      const approvedAtString = formatDateField(data.approvedAtFirestore) || formatDateField(data.approvedAt);

      // Construct the object for the client, ensuring no raw Timestamp objects are passed.
      // Explicitly list all properties expected by NewLocationSuggestion type for client-side.
      const clientSuggestion: NewLocationSuggestion = {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        townName: data.townName,
        category: data.category,
        suggesterName: data.suggesterName,
        suggesterComment: data.suggesterComment, // Will be undefined if not present in data
        status: data.status,
        submittedAt: submittedAtString,
        // approvedAt can be undefined if not approved yet
        ...(approvedAtString && { approvedAt: approvedAtString }), 
        publishedLocationId: data.publishedLocationId, // Will be undefined if not present
        coordinates: data.coordinates, // Assuming this is already a plain {lat, lng} object
        imageUrl: data.imageUrl, // Will be undefined if not present
        // Ensure `submittedAtFirestore` and `approvedAtFirestore` are NOT included
      };
      
      return clientSuggestion;
    });
  } catch (error) {
    console.error("Error fetching suggested locations:", error);
    return [];
  }
}
