
import type { Town, Location, LocationComment, SuggestedComment } from './types';
import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  Timestamp,
  orderBy // Added orderBy
} from 'firebase/firestore';
import { randomUUID } from 'crypto'; // For comment IDs if necessary

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
      
      // Fetch approved suggested comments for this location
      const suggestedCommentsCol = collection(db, 'suggestedComments');
      const sq = query(suggestedCommentsCol, 
        where('locationId', '==', docSnap.id), 
        where('status', '==', 'approved'),
        orderBy('submittedAtFirestore', 'desc') // Or 'submittedAt' if that's the string version
      );
      const suggestedCommentsSnap = await getDocs(sq);
      const approvedSuggestedComments: LocationComment[] = suggestedCommentsSnap.docs.map(sDoc => {
        const sData = sDoc.data() as SuggestedComment;
        return {
          id: sDoc.id, // Use suggestedComment doc ID
          user: sData.userName,
          comment: sData.commentText,
          date: formatDateField(sData.submittedAtFirestore || sData.submittedAt),
        };
      });

      // Merge and sort comments
      const existingComments: LocationComment[] = (data.comments || []).map((comment: any) => ({
        id: comment.id || randomUUID(),
        user: comment.user,
        comment: comment.comment,
        date: formatDateField(comment.date),
      }));
      
      let allComments = [...existingComments, ...approvedSuggestedComments];
      // Deduplicate comments based on ID, preferring original ones if IDs might clash (unlikely here)
      const uniqueComments = Array.from(new Map(allComments.map(c => [c.id, c])).values());
      uniqueComments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


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
        comments: uniqueComments,
        createdAt: formatDateField(data.createdAtFirestore || data.createdAt),
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

    // Fetch approved suggested comments for this location
    const suggestedCommentsCol = collection(db, 'suggestedComments');
    const sq = query(suggestedCommentsCol, 
      where('locationId', '==', id), 
      where('status', '==', 'approved'),
      orderBy('submittedAtFirestore', 'desc') // Or 'submittedAt' if that's the string version
    );
    const suggestedCommentsSnap = await getDocs(sq);
    const approvedSuggestedComments: LocationComment[] = suggestedCommentsSnap.docs.map(sDoc => {
      const sData = sDoc.data() as SuggestedComment; // Cast to SuggestedComment type
      return {
        id: sDoc.id, // Use suggestedComment doc ID
        user: sData.userName,
        comment: sData.commentText,
        date: formatDateField(sData.submittedAtFirestore || sData.submittedAt), // Use appropriate date field
      };
    });
    
    const existingComments: LocationComment[] = (data.comments || []).map((comment: any) => ({
      id: comment.id || randomUUID(),
      user: comment.user,
      comment: comment.comment,
      date: formatDateField(comment.date),
    }));

    let allComments = [...existingComments, ...approvedSuggestedComments];
    // Deduplicate comments based on ID, preferring original ones if IDs might clash.
    const uniqueComments = Array.from(new Map(allComments.map(c => [c.id, c])).values());
    // Sort all comments by date, most recent first.
    uniqueComments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // DIAGNOSTIC LOGGING:
    console.log(`[DEBUG] getLocationById(${id}): Fetched comments:`, JSON.stringify(uniqueComments, null, 2));
    // If uniqueComments is empty or only contains comments you expect, the issue is not data fetching here.
    // If it contains the deleted comments, they are still in Firestore in either data.comments or suggestedComments (approved).

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
      comments: uniqueComments,
      createdAt: formatDateField(data.createdAtFirestore || data.createdAt),
    };
    return location;
  } catch (error) {
    console.error(`Error fetching location by ID ${id}:`, error);
    return undefined;
  }
}


export const locationCategories = [
  "Park",
  "Nature Spot",
  "Cafe",
  "Pub / Restaurant",
  "Shop",
  "Landmark",
  "Viewpoint",
  "Gallery / Museum",
  "Attraction",
  "Historical Site",
  "Accommodation",
  "Lovely spot",
  "Quirky",
  "Art",
  "Architecture",
  "Other"
];

export const mockTowns: Pick<Town, 'id' | 'name'>[] = [
    { id: 'formby', name: 'Formby' },
    { id: 'windermere', name: 'Windermere' },
    { id: 'stives', name: 'St Ives' },
  ];
  
