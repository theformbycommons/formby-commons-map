
'use server';

import type { NewLocationSuggestion } from './types';
import { db } from './firebase'; // Using client-side db for these admin read operations for now
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';

// Helper to convert Firestore timestamp to ISO string or return existing string/undefined
const formatDateField = (dateField: any): string | undefined => {
  if (dateField instanceof Timestamp) {
    return dateField.toDate().toISOString();
  }
  if (typeof dateField === 'string') {
    try {
      // Attempt to parse and re-format to ensure it's a valid ISO string
      return new Date(dateField).toISOString();
    } catch (e) {
      // If parsing fails, it's not a valid date string
      console.warn(`formatDateField in admin-data: Invalid date string provided: ${dateField}. Returning undefined.`);
      return undefined;
    }
  }
  // If field is undefined or null, or any other type, return undefined.
  return undefined; 
};


export async function getSuggestedLocations(): Promise<NewLocationSuggestion[]> {
  try {
    const suggestionsCol = collection(db, 'suggestedLocations');
    const q = query(suggestionsCol, orderBy('submittedAtFirestore', 'desc'));
    const suggestionSnapshot = await getDocs(q);

    return suggestionSnapshot.docs.map(docSnap => {
      const data = docSnap.data();

      // Process dates: prefer ...Firestore fields if they are Timestamps, otherwise fallback to string fields
      const submittedAtString = formatDateField(data.submittedAtFirestore) || formatDateField(data.submittedAt);
      const approvedAtString = formatDateField(data.approvedAtFirestore) || formatDateField(data.approvedAt);

      // Construct the object for the client, ensuring no raw Timestamp objects are passed.
      const clientSuggestion: NewLocationSuggestion = {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        townName: data.townName,
        suggesterName: data.suggesterName,
        status: data.status,
        submittedAt: submittedAtString || new Date(0).toISOString(), // Fallback if submittedAtString is undefined
        ...(approvedAtString && { approvedAt: approvedAtString }), 
        publishedLocationId: data.publishedLocationId, 
        coordinates: data.coordinates, 
        imageUrl: data.imageUrl, 
      };
      
      return clientSuggestion;
    });
  } catch (error) {
    console.error("Error fetching suggested locations:", error);
    return [];
  }
}
