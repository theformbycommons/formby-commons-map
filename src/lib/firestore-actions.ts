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
    const q = query(locationsRef, where('status', '==', 'approved'));
    const querySnapshot = await getDocs(q);

    const locations: SuggestedLocation[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Debug output: inspect raw data in DevTools Console
      console.log(`[Firestore Doc: ${doc.id}] Keys found:`, Object.keys(data), data);

      let formattedDate: string | undefined = undefined;
      const rawDate = data.submittedAt || data.createdAt || data.timestamp || data.date;

      if (rawDate) {
        if (typeof rawDate.toDate === 'function') {
          formattedDate = rawDate.toDate().toISOString();
        } else if (typeof rawDate.seconds === 'number') {
          formattedDate = new Date(rawDate.seconds * 1000).toISOString();
        } else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
          formattedDate = new Date(rawDate).toISOString();
        }
      }

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
        submittedAt: formattedDate,
        createdAt: formattedDate,
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
    status: 'pending',
    issueStatus: 'reported',
    townName: 'Formby',
    coordinates: data.coordinates,
    suggesterName: data.suggesterName || 'Anonymous',
    imageUrl: null,
    submittedAt: serverTimestamp(),
    createdAt: new Date().toISOString(), // Hardcoded ISO string backup
  });

  return newDoc.id;
}
