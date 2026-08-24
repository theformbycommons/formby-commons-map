import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import type { SuggestedLocation } from '@/lib/types';

const COLLECTION_NAME = 'suggestedLocations';

/**
 * Helper to safely resolve various Firestore timestamp formats into a valid ISO string.
 */
function parseRawTimestamp(rawDate: any): string | undefined {
  if (!rawDate) return undefined;

  try {
    // 1. Standard Firestore Timestamp object with .toDate() method
    if (typeof rawDate?.toDate === 'function') {
      return rawDate.toDate().toISOString();
    }
    // 2. Serialized Firestore Timestamp object with seconds/nanoseconds
    if (typeof rawDate?.seconds === 'number') {
      return new Date(rawDate.seconds * 1000).toISOString();
    }
    // 3. String representation or numerical Unix milliseconds
    if (typeof rawDate === 'string' || typeof rawDate === 'number') {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    // 4. Native JS Date object
    if (rawDate instanceof Date) {
      return rawDate.toISOString();
    }
  } catch (err) {
    console.warn('[parseRawTimestamp] Could not parse date field:', rawDate, err);
  }

  return undefined;
}

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

      // Check submittedAtFirestore first to align with your Firestore schema
      const rawDate =
        data.submittedAtFirestore ??
        data.submittedAt ??
        data.createdAt ??
        data.timestamp ??
        data.date;

      const formattedDate = parseRawTimestamp(rawDate);

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
  const nowIso = new Date().toISOString();

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
    submittedAtFirestore: serverTimestamp(), // Writes to existing schema key
    submittedAt: serverTimestamp(),
    createdAt: nowIso,
  });

  return newDoc.id;
}
