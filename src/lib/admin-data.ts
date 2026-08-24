import type { NewLocationSuggestion } from './types';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

function parseAnyDate(val: any): string | undefined {
  if (!val) return undefined;

  // 1. Direct JS Date
  if (val instanceof Date) return val.toISOString();

  // 2. Firestore Timestamp object or instance with .toDate()
  if (typeof val?.toDate === 'function') {
    try {
      return val.toDate().toISOString();
    } catch (e) {
      /* ignore */
    }
  }

  // 3. Serialized Firestore object with seconds ({ seconds, nanoseconds } or { _seconds, _nanoseconds })
  const seconds = val?.seconds ?? val?._seconds;
  if (typeof seconds === 'number') {
    return new Date(seconds * 1000).toISOString();
  }

  // 4. ISO String or parseable date string
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // 5. Epoch milliseconds
  if (typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return undefined;
}

export async function getSuggestedLocations(): Promise<NewLocationSuggestion[]> {
  try {
    const suggestionsCol = collection(db, 'suggestedLocations');
    const snapshot = await getDocs(suggestionsCol);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();

      // LOG RAW DATA TO BROWSER CONSOLE FOR EASY DEBBUGGING
      console.log(`[DEBUG] Raw suggestion doc (${docSnap.id}):`, data);

      // Check every single possible property name where date might live
      const rawDate =
        data.submittedAtFirestore ??
        data.submittedAt ??
        data.createdAt ??
        data.createdAtFirestore ??
        data.timestamp ??
        data.date;

      const validIsoDate = parseAnyDate(rawDate) || new Date().toISOString();

      return {
        id: docSnap.id,
        name: data.name ?? data.locationName ?? data.title ?? 'Untitled',
        description: data.description ?? '',
        townName: data.townName ?? '',
        suggesterName: data.suggesterName ?? data.submittedBy ?? data.email ?? 'Anonymous',
        status: data.status ?? 'Pending',
        submittedAt: validIsoDate,
        publishedLocationId: data.publishedLocationId ?? null,
        coordinates: data.coordinates
          ? { lat: Number(data.coordinates.lat) || 0, lng: Number(data.coordinates.lng) || 0 }
          : { lat: 0, lng: 0 },
        imageUrl: data.imageUrl ?? null,
      };
    });
  } catch (error) {
    console.error('Error fetching suggested locations:', error);
    return [];
  }
}
