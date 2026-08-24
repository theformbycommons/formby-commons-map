import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { SuggestedLocation } from '@/lib/types';

const COLLECTION_NAME = 'suggestedLocations';

/**
 * Helper to safely extract and parse any date format from Firestore
 * into a clean, serializable ISO string.
 */
function extractIsoDate(data: Record<string, any>): string | undefined {
  // Check every common property name used for timestamps
  const rawDate =
    data.submittedAt ??
    data.createdAt ??
    data.timestamp ??
    data.submittedAtFirestore ??
    data.createdAtFirestore;

  if (!rawDate) return undefined;

  try {
    // 1. Native Firestore Timestamp object with .toDate()
    if (typeof rawDate?.toDate === 'function') {
      return rawDate.toDate().toISOString();
    }

    // 2. Serialized timestamp with seconds ({ seconds: number } or { _seconds: number })
    const seconds = rawDate?.seconds ?? rawDate?._seconds;
    if (typeof seconds === 'number') {
      return new Date(seconds * 1000).toISOString();
    }

    // 3. Existing ISO String or epoch timestamp number
    if (typeof rawDate === 'string' || typeof rawDate === 'number') {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }

    // 4. Standard JS Date instance
    if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      return rawDate.toISOString();
    }
  } catch (error) {
    console.warn('Failed to parse document timestamp:', error);
  }

  return undefined;
}

/**
 * Fetches all submissions regardless of status for admin management.
 */
export async function getAllLocationsForAdmin(): Promise<SuggestedLocation[]> {
  try {
    const locationsRef = collection(db, COLLECTION_NAME);
    const querySnapshot = await getDocs(locationsRef);

    const locations: SuggestedLocation[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      locations.push({
        id: doc.id,
        name: data.name || 'Untitled Suggestion',
        description: data.description || '',
        category: data.category || 'other',
        status: data.status || 'pending',
        issueStatus: data.issueStatus || 'reported',
        townName: data.townName || 'Formby',
        coordinates: {
          lat: data.coordinates?.lat || 53.559,
          lng: data.coordinates?.lng || -3.069,
        },
        // Extracted safely regardless of field key or raw timestamp type
        submittedAt: extractIsoDate(data),
        suggesterName: data.suggesterName || 'Anonymous',
      } as SuggestedLocation);
    });

    return locations;
  } catch (error) {
    console.error('Error fetching admin locations:', error);
    return [];
  }
}

/**
 * Updates approval status ('approved', 'rejected', 'pending')
 */
export async function updateLocationStatus(id: string, newStatus: 'approved' | 'rejected' | 'pending') {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { status: newStatus });
}

/**
 * Updates resolution status ('reported', 'resolved')
 */
export async function updateIssueStatus(id: string, newIssueStatus: 'reported' | 'resolved') {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { issueStatus: newIssueStatus });
}

/**
 * Updates content fields directly (Inline editing)
 */
export async function updateLocationDetails(
  id: string,
  updatedData: Partial<Pick<SuggestedLocation, 'name' | 'description' | 'category'>>
) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updatedData);
}

/**
 * Permanently removes a document
 */
export async function deleteLocation(id: string) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
