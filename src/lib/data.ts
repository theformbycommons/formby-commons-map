
import type { Town, Location, LocationComment, NewLocationSuggestion } from './types';
import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  Timestamp,
  // addDoc // We'll use addDoc in actions.ts for suggestions
} from 'firebase/firestore';

// Helper to convert Firestore timestamp to ISO string or return existing string
const formatDateField = (dateField: any): string => {
  if (dateField instanceof Timestamp) {
    return dateField.toDate().toISOString();
  }
  if (typeof dateField === 'string') {
    return dateField;
  }
  return new Date().toISOString(); // Fallback
};


export async function getTowns(): Promise<Town[]> {
  try {
    const townsCol = collection(db, 'towns');
    const townSnapshot = await getDocs(townsCol);
    const townsList = townSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as Omit<Town, 'locationCount'>));

    // For each town, calculate locationCount
    const townsWithCounts: Town[] = [];
    for (const town of townsList) {
      const locationsCol = collection(db, 'locations');
      const q = query(locationsCol, where('townId', '==', town.id));
      const locationSnapshot = await getDocs(q);
      townsWithCounts.push({ ...town, locationCount: locationSnapshot.size });
    }
    return townsWithCounts;
  } catch (error) {
    console.error("Error fetching towns:", error);
    return [];
  }
}

export async function getTownByName(name: string): Promise<Town | undefined> {
  try {
    const decodedName = decodeURIComponent(name);
    const townsCol = collection(db, 'towns');
    const q = query(townsCol, where('name', '==', decodedName)); // Assuming names are unique, or take the first
    const townSnapshot = await getDocs(q);

    if (townSnapshot.empty) {
      console.log(`No town found with name: ${decodedName}`);
      return undefined;
    }
    const townDoc = townSnapshot.docs[0];
    const townData = { id: townDoc.id, ...townDoc.data() } as Omit<Town, 'locationCount'>;

    // Calculate locationCount
    const locationsCol = collection(db, 'locations');
    const lq = query(locationsCol, where('townId', '==', townDoc.id));
    const locationSnapshot = await getDocs(lq);
    
    return { ...townData, locationCount: locationSnapshot.size };
  } catch (error) {
    console.error(`Error fetching town by name ${name}:`, error);
    return undefined;
  }
}

export async function getLocationsByTownId(townId: string): Promise<Location[]> {
  try {
    const locationsCol = collection(db, 'locations');
    const q = query(locationsCol, where('townId', '==', townId));
    const locationSnapshot = await getDocs(q);
    return locationSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        comments: (data.comments || []).map((comment: any) => ({
          ...comment,
          date: formatDateField(comment.date),
        })),
      } as Location;
    });
  } catch (error) {
    console.error(`Error fetching locations for town ID ${townId}:`, error);
    return [];
  }
}

export async function getLocationById(id: string): Promise<Location | undefined> {
  try {
    const locDocRef = doc(db, 'locations', id);
    const docSnap = await getDoc(locDocRef);

    if (!docSnap.exists()) {
      console.log(`No location found with ID: ${id}`);
      return undefined;
    }
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      comments: (data.comments || []).map((comment: any) => ({
        ...comment,
        date: formatDateField(comment.date),
      })),
    } as Location;
  } catch (error) {
    console.error(`Error fetching location by ID ${id}:`, error);
    return undefined;
  }
}


// locationCategories remains static as it's not from DB
export const locationCategories = [
  "Park",
  "Nature Spot",
  "Cafe",
  "Restaurant",
  "Pub / Restaurant",
  "Shop",
  "Landmark",
  "Viewpoint",
  "Museum",
  "Gallery / Museum",
  "Attraction",
  "Historical Site",
  "Accommodation",
  "Other"
];

// Mock data below is no longer used by the functions above.
// You can remove it or keep it for reference.
/*
export const mockComments: LocationComment[] = [
  // ...
];

export const mockTowns: Town[] = [
  // ...
];

export const mockLocations: Location[] = [
  // ...
];
*/
// The addSuggestedLocation function from mock data is removed,
// as this logic will now reside in `src/lib/actions.ts` to directly interact with Firestore.

// For use in SuggestLocationForm for town datalist (can be replaced with a fetch if towns are many)
export const mockTowns: Pick<Town, 'id' | 'name'>[] = [
    { id: 'formby', name: 'Formby' },
    { id: 'windermere', name: 'Windermere' },
    { id: 'stives', name: 'St Ives' },
  ];
  // In a real app, you might want to fetch town names for the suggestion form dynamically
  // or manage a smaller list. For now, this mock list for the datalist is fine.
  // Or, users can just type the town name.
