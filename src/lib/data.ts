
import type { Town, Location } from './types';
import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

// Helper to convert Firestore timestamp to ISO string or return existing string
const formatDateField = (dateField: any): string => {
  if (dateField instanceof Timestamp) {
    return dateField.toDate().toISOString();
  }
  if (typeof dateField === 'string') {
    try {
      return new Date(dateField).toISOString();
    } catch (e) {
      console.warn(`Invalid date string encountered: ${dateField}`);
      return new Date(0).toISOString();
    }
  }
  return new Date(0).toISOString();
};


export async function getTowns(): Promise<Town[]> {
  try {
    const townsCol = collection(db, 'towns');
    const townSnapshot = await getDocs(townsCol);
    const townsList = townSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        county: data.county,
        country: data.country,
        coordinates: data.coordinates,
        description: data.description,
        imageUrl: data.imageUrl,
      } as Omit<Town, 'locationCount'>;
    });

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
    
    const locationsPromises = locationSnapshot.docs.map(async docSnap => {
      const data = docSnap.data();
      
      const location: Location = {
        id: docSnap.id,
        townId: data.townId,
        townName: data.townName,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl || null,
        coordinates: data.coordinates,
        submittedBy: data.submittedBy,
        createdAt: formatDateField(data.createdAtFirestore || data.createdAt),
        votes: data.votes || { neutral: 0, positive: 0, fantastic: 0 },
      };
      return location;
    });
    return Promise.all(locationsPromises);
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

    const location: Location = {
      id: docSnap.id,
      townId: data.townId,
      townName: data.townName,
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl || null,
      coordinates: data.coordinates,
      submittedBy: data.submittedBy,
      createdAt: formatDateField(data.createdAtFirestore || data.createdAt),
      votes: data.votes || { neutral: 0, positive: 0, fantastic: 0 },
    };
    return location;
  } catch (error) {
    console.error(`Error fetching location by ID ${id}:`, error);
    return undefined;
  }
}
