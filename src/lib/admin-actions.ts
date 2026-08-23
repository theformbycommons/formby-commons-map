import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { SuggestedLocation } from '@/lib/types';

const COLLECTION_NAME = 'suggestedLocations';

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
        submittedAt: data.submittedAt ? new Date(data.submittedAt.seconds * 1000).toISOString() : undefined,
        suggesterName: data.suggesterName || 'Anonymous',
      });
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
