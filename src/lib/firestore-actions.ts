import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import type { SuggestedLocation } from '@/lib/types';

const COLLECTION_NAME = 'suggestedLocations';

/**
 * Fetches all approved actions for display on the Formby map.
 */
export async function getApprovedLocations(): Promise<SuggestedLocation[]> {
  try {
    const locationsRef = collection(db, COLLECTION_NAME);
    // Fetch locations that are approved (or fallback to status if needed)
    const q = query(locationsRef, where('status', '==', 'approved'));
    const querySnapshot = await getDocs(q);

    const locations: SuggestedLocation[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      locations.push({
        id: doc.id,
        name: data.name || 'Reported Action',
        description: data.description || '',
        category: data.category || 'other',
        status: data.status || 'approved',
        issueStatus: data.issueStatus || 'reported',
        townName: data.townName || 'Formby',
        coordinates: {
          lat: data.coordinates?.lat || 53.559,
          lng: data.coordinates?.lng || -3.069,
        },
        submittedAt: data.submittedAt ? new Date(data.submittedAt.seconds * 1000).toISOString() : undefined,
        suggesterName: data.suggesterName || '',
        imageUrl: data.imageUrl || null,
      });
    });

    return locations;
  } catch (error) {
    console.error('Error fetching approved locations:', error);
    return [];
  }
}

/**
 * Saves a new community submission with 'pending' status for admin approval.
 */
export async function submitNewAction(data: {
  name: string;
  description: string;
  category: string;
  coordinates: { lat: number; lng: number };
  suggesterName?: string;
}): Promise<string> {
  const locationsRef = collection(db, COLLECTION_NAME);

  const newDoc = await addDoc(locationsRef, {
    name: data.name,
    description: data.description,
    category: data.category,
    status: 'pending', // Starts as pending for admin review
    issueStatus: 'reported',
    townName: 'Formby',
    coordinates: data.coordinates,
    suggesterName: data.suggesterName || 'Anonymous',
    imageUrl: null,
    submittedAt: serverTimestamp(),
  });

  return newDoc.id;
}
