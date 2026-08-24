import type { NewLocationSuggestion } from './types';
import { db } from '@/lib/firebase'; // Use shared client Firestore instance
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';

// Helper to convert any Firestore timestamp, string, or date representation to an ISO string
const formatDateField = (dateField: any): string | undefined => {
  if (!dateField) return undefined;

  try {
    // 1. Direct Timestamp instance or object with .toDate() method
    if (typeof dateField?.toDate === 'function') {
      return dateField.toDate().toISOString();
    }

    // 2. Serialized Timestamp object with seconds ({ seconds, nanoseconds } or { _seconds, _nanoseconds })
    const seconds = dateField?.seconds ?? dateField?._seconds;
    if (typeof seconds === 'number') {
      return new Date(seconds * 1000).toISOString();
    }

    // 3. Already a JS Date object
    if (dateField instanceof Date) {
      return dateField.toISOString();
    }

    // 4. String format
    if (typeof dateField === 'string') {
      const parsedDate = new Date(dateField);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }

    // 5. Numeric epoch ms timestamp
    if (typeof dateField === 'number') {
      return new Date(dateField).toISOString();
    }
  } catch (e) {
    console.warn('formatDateField in admin-data failed to parse date:', dateField, e);
  }

  return undefined;
};

export async function getSuggestedLocations(): Promise<NewLocationSuggestion[]> {
  try {
    const suggestionsCol = collection(db, 'suggestedLocations');
    
    // Try executing with orderBy; fallback to plain collection fetch if query fails (e.g. index issue)
    let suggestionSnapshot;
    try {
      const q = query(suggestionsCol, orderBy('submittedAtFirestore', 'desc'));
      suggestionSnapshot = await getDocs(q);
    } catch (queryErr) {
      console.warn('Ordered query failed, falling back to unordered fetch:', queryErr);
      suggestionSnapshot = await getDocs(suggestionsCol);
    }

    return suggestionSnapshot.docs.map((docSnap) => {
      const data = docSnap.data();

      // Exhaustive fallback chain across potential date keys
      const rawSubmittedAt =
        data.submittedAtFirestore ??
        data.submittedAt ??
        data.createdAt ??
        data.timestamp ??
        data.date;

      const rawApprovedAt =
        data.approvedAtFirestore ??
        data.approvedAt;

      const submittedAtString = formatDateField(rawSubmittedAt);
      const approvedAtString = formatDateField(rawApprovedAt);

      // Handle nested coordinates safely
      const coordinates = data.coordinates
        ? { lat: Number(data.coordinates.lat) || 0, lng: Number(data.coordinates.lng) || 0 }
        : { lat: 0, lng: 0 };

      const clientSuggestion: NewLocationSuggestion = {
        id: docSnap.id,
        name: data.name ?? data.locationName ?? data.title ?? '',
        description: data.description ?? '',
        townName: data.townName ?? '',
        suggesterName: data.suggesterName ?? data.submittedBy ?? data.email ?? 'Anonymous',
        status: data.status ?? 'Pending',
        submittedAt: submittedAtString || new Date().toISOString(),
        ...(approvedAtString && { approvedAt: approvedAtString }),
        publishedLocationId: data.publishedLocationId ?? null,
        coordinates,
        imageUrl: data.imageUrl ?? null,
      };

      return clientSuggestion;
    });
  } catch (error) {
    console.error('Error fetching suggested locations in admin-data:', error);
    return [];
  }
}
