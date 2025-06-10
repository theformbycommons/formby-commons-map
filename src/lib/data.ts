
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
import { randomUUID } from 'crypto'; // For comment IDs if necessary

// Helper to convert Firestore timestamp to ISO string or return existing string
const formatDateField = (dateField: any): string => {
  if (dateField instanceof Timestamp) {
    return dateField.toDate().toISOString();
  }
  if (typeof dateField === 'string') {
    // Attempt to parse and re-format to ensure it's a valid ISO string,
    // or return as is if it's already a valid ISO string.
    try {
      return new Date(dateField).toISOString();
    } catch (e) {
      // If parsing fails, it might not be a date string, or an invalid one.
      // Fallback or handle as an error. For now, returning a default.
      console.warn(`Invalid date string encountered: ${dateField}`);
      return new Date(0).toISOString(); // Default to epoch for invalid strings
    }
  }
  // If undefined, null, or other type, return a default or handle as error.
  // console.warn(`formatDateField received an unexpected type or undefined value:`, dateField);
  return new Date(0).toISOString(); // Default to epoch for undefined/null or unexpected types
};


export async function getTowns(): Promise<Town[]> {
  try {
    const townsCol = collection(db, 'towns');
    const townSnapshot = await getDocs(townsCol);
    const townsList = townSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      // Ensure we construct the Town object explicitly to avoid passing unwanted fields
      return {
        id: docSnap.id,
        name: data.name,
        county: data.county,
        country: data.country,
        coordinates: data.coordinates, // Assuming this is already a plain object
        description: data.description,
        imageUrl: data.imageUrl,
      } as Omit<Town, 'locationCount'>;
    });

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
    const q = query(townsCol, where('name', '==', decodedName));
    const townSnapshot = await getDocs(q);

    if (townSnapshot.empty) {
      console.log(`No town found with name: ${decodedName}`);
      return undefined;
    }
    const townDoc = townSnapshot.docs[0];
    const data = townDoc.data();
    const townData = {
        id: townDoc.id,
        name: data.name,
        county: data.county,
        country: data.country,
        coordinates: data.coordinates,
        description: data.description,
        imageUrl: data.imageUrl,
    } as Omit<Town, 'locationCount'>;

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
      // Explicitly construct the Location object to ensure plain objects for client components
      const location: Location = {
        id: docSnap.id,
        townId: data.townId,
        townName: data.townName,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl || null,
        category: data.category,
        coordinates: data.coordinates, // Assuming this is already a plain {lat, lng} object
        submittedBy: data.submittedBy,
        comments: (data.comments || []).map((comment: any) => ({
          id: comment.id || randomUUID(), // Ensure comment has an ID
          user: comment.user,
          comment: comment.comment,
          date: formatDateField(comment.date), // Ensure comment date is a string
        })),
        createdAt: formatDateField(data.createdAtFirestore || data.createdAt), // Ensure createdAt is a string
      };
      return location;
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
    // Explicitly construct the Location object
    const location: Location = {
      id: docSnap.id,
      townId: data.townId,
      townName: data.townName,
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl || null,
      category: data.category,
      coordinates: data.coordinates,
      submittedBy: data.submittedBy,
      comments: (data.comments || []).map((comment: any) => ({
        id: comment.id || randomUUID(), // Ensure comment has an ID
        user: comment.user,
        comment: comment.comment,
        date: formatDateField(comment.date),
      })),
      createdAt: formatDateField(data.createdAtFirestore || data.createdAt),
    };
    return location;
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

// For use in SuggestLocationForm for town datalist
export const mockTowns: Pick<Town, 'id' | 'name'>[] = [
    { id: 'formby', name: 'Formby' },
    { id: 'windermere', name: 'Windermere' },
    { id: 'stives', name: 'St Ives' },
  ];
  
