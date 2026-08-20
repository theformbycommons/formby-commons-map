


import { z } from 'zod';
import type { NewLocationSuggestion, Location, Town } from './types';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  getDoc,
  deleteDoc,
  runTransaction,
  increment,
} from 'firebase/firestore';

// --- CONFIGURABLE LIMITS ---
// These values can be changed to adjust daily limits for anonymous users.
const ANONYMOUS_USER_DAILY_SUGGESTION_LIMIT = 5;
const ANONYMOUS_USER_DAILY_VOTE_LIMIT = 5;

// Zod schema for server-side validation (SuggestLocationForm)
const SuggestionFormSchemaServer = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().max(1000).optional().refine((val) => {
    if (val === undefined) return true;
    const t = String(val).trim();
    return t.length === 0 || t.length >= 10;
  }, { message: 'Description must be at least 10 characters if provided.' }),
  townName: z.string().min(2, "Town name is required").max(50),
  category: z.string().optional(),
  issueStatus: z.enum(['reported','improved']).optional(),
  latitude: z.preprocess(
    (val) => Number(val),
    z.number().min(-90, "Invalid latitude. Please select a location on the map.").max(90, "Invalid latitude. Please select a location on the map.")
  ),
  longitude: z.preprocess(
    (val) => Number(val),
    z.number().min(-180, "Invalid longitude. Please select a location on the map.").max(180, "Invalid longitude. Please select a location on the map.")
  ),
  suggesterUid: z.string().min(1, "User ID is missing.").optional(),
  suggesterAnonId: z.string().optional(),
  suggesterName: z.string().min(2, "Your name must be at least 2 characters").max(50),
});

export interface SuggestionFormState {
  message: string;
  type: 'success' | 'error' | 'info';
  errors?: Record<string, (string[] | undefined)>;
  submittedSuggestionData?: Omit<NewLocationSuggestion, 'suggesterComment'>;
}

async function checkAndIncrementAnonymousUserDailyLimit(uid: string, limit: number, collectionNamePath: string, dateFieldName: string, countFieldName: string = 'count'): Promise<{ allowed: boolean; message?: string }> {
  try {
    const todayDateString = new Date().toISOString().split('T')[0];
    const userLimitRef = doc(db, collectionNamePath, uid);

    await runTransaction(db, async (transaction) => {
      const userLimitDoc = await transaction.get(userLimitRef);

      if (!userLimitDoc.exists()) {
        transaction.set(userLimitRef, {
          [countFieldName]: 1,
          [dateFieldName]: todayDateString,
        });
        return;
      }

      const data = userLimitDoc.data()!;
      if (data[dateFieldName] !== todayDateString) {
        transaction.update(userLimitRef, {
          [countFieldName]: 1,
          [dateFieldName]: todayDateString,
        });
        return;
      }

      if (data[countFieldName] >= limit) {
        throw new Error(`You have reached the daily limit of ${limit} submissions for this action. Please try again tomorrow.`);
      }

      transaction.update(userLimitRef, { [countFieldName]: increment(1) });
    });
    return { allowed: true };
  } catch (error: any) {
    console.error(`Error checking/incrementing daily limit for UID ${uid} in ${collectionNamePath}:`, error);
    const errorMessage = error.message.includes('Firebase Admin SDK')
      ? 'Server is not configured for this action. Could not check daily limits.'
      : error.message || `Failed to verify daily submission limit for this action.`;
    return { allowed: false, message: errorMessage };
  }
}


export async function submitSuggestion(
  prevState: SuggestionFormState | undefined,
  formData: FormData
): Promise<SuggestionFormState> {
  const rawFormData = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string | null) || undefined,
    townName: formData.get('townName') as string,
    suggesterName: formData.get('suggesterName') as string,
    category: (formData.get('category') as string | null) || undefined,
    issueStatus: (formData.get('issueStatus') as string | null) || undefined,
    latitude: formData.get('latitude') as string,
    longitude: formData.get('longitude') as string,
    suggesterUid: (formData.get('suggesterUid') as string | null) || undefined,
    suggesterAnonId: (formData.get('suggesterAnonId') as string | null) || undefined,
  };

  const validatedFields = SuggestionFormSchemaServer.safeParse(rawFormData);

  if (!validatedFields.success) {
    const flatErrors = validatedFields.error.flatten();
    let detailedErrorMessage = "Validation failed. Details: ";
    for (const [field, messages] of Object.entries(flatErrors.fieldErrors)) {
        if (messages) detailedErrorMessage += `${field}: ${messages.join(', ')}; `;
    }
    if (flatErrors.formErrors.length > 0) {
        detailedErrorMessage += `Form errors: ${flatErrors.formErrors.join(', ')}; `;
    }
    return {
      message: detailedErrorMessage.length > "Validation failed. Details: ".length ? detailedErrorMessage : "Validation failed. Please check form fields.",
      type: 'error',
      errors: flatErrors.fieldErrors,
    };
  }
  
  const { latitude, longitude, suggesterUid, ...dataFromValidation } = validatedFields.data;

  try {
    if (suggesterUid) {
      const dailyLimitCheck = await checkAndIncrementAnonymousUserDailyLimit(suggesterUid, ANONYMOUS_USER_DAILY_SUGGESTION_LIMIT, 'userDailySuggestionLimits', 'lastSubmissionDate');
      if (!dailyLimitCheck.allowed) {
        return {
          message: dailyLimitCheck.message || "Daily suggestion limit reached.",
          type: 'error',
        };
      }
    } else if ((validatedFields.data as any).suggesterAnonId) {
      const anonId = (validatedFields.data as any).suggesterAnonId as string;
      const dailyLimitCheck = await checkAndIncrementAnonymousUserDailyLimit(anonId, ANONYMOUS_USER_DAILY_SUGGESTION_LIMIT, 'anonDailySuggestionLimits', 'lastSubmissionDate');
      if (!dailyLimitCheck.allowed) {
        return {
          message: dailyLimitCheck.message || "Daily suggestion limit reached.",
          type: 'error',
        };
      }
    }

    // Use client Firestore `db` for static-export-friendly operations
    const suggestionForDb = {
      name: dataFromValidation.name,
      description: dataFromValidation.description,
      townName: dataFromValidation.townName,
      suggesterName: dataFromValidation.suggesterName,
      imageUrl: null,
      category: (validatedFields.data as any).category || null,
      issueStatus: (validatedFields.data as any).issueStatus || 'reported',
      status: 'pending' as const,
      submittedAtFirestore: serverTimestamp(),
      coordinates: {
        lat: latitude,
        lng: longitude,
      },
      ...(suggesterUid && { suggesterUid }),
    };

    // Attachments removed: file uploads are no longer supported from the client.

    const newDocRef = await addDoc(collection(db, 'suggestedLocations'), suggestionForDb);

    // Create a plain object for the client, removing server-only values like FieldValue
    const { submittedAtFirestore, ...plainSuggestionData } = suggestionForDb;

    return {
      message: `Thank you, ${validatedFields.data.suggesterName}! Your suggestion for "${validatedFields.data.name}" has been received and is pending review.`,
      type: 'success',
      submittedSuggestionData: {
        id: newDocRef.id,
        ...plainSuggestionData,
        submittedAt: new Date().toISOString(), // Use current date as a client-side representation
      },
    };

  } catch (error: any) {
    console.error("Error in submitSuggestion action:", error);
    const errorMessage = error.message.includes('Firebase Admin SDK')
      ? "Server is not configured for this action. Please contact support."
      : `Error: ${error.message || 'An unknown error occurred'}`;
    return {
      message: errorMessage,
      type: 'error',
    };
  }
}


export interface ApproveSuggestionFormState {
  message: string;
  type: 'success' | 'error' | 'info';
  suggestionId?: string;
}

export async function approveSuggestion(
  prevState: ApproveSuggestionFormState | undefined,
  formData: FormData
): Promise<ApproveSuggestionFormState> {
  const suggestionId = formData.get('suggestionId') as string;

  if (!suggestionId) {
    return { message: "Suggestion ID is missing.", type: 'error', suggestionId };
  }

  try {
    const suggestionRef = doc(db, 'suggestedLocations', suggestionId);
    const suggestionSnap = await getDoc(suggestionRef);

    if (!suggestionSnap.exists) {
      return { message: "Suggestion not found.", type: 'error', suggestionId };
    }
    const suggestionData = suggestionSnap.data() as NewLocationSuggestion;

    if (suggestionData.status === 'rejected') {
      return { message: `Suggestion "${suggestionData.name}" has been rejected and cannot be published.`, type: 'info', suggestionId };
    }

    if (suggestionData.status === 'approved' && suggestionData.publishedLocationId) {
      // Static-export site: no server revalidation. Notify caller that item is already approved.
      return { message: `Suggestion "${suggestionData.name}" is already approved and published with ID: ${suggestionData.publishedLocationId}.`, type: 'info', suggestionId };
    }

    // Find town by name using a client-side query
    const townsColRef = collection(db, 'towns');
    const townQuerySnapshot = await (await import('firebase/firestore')).getDocs((await import('firebase/firestore')).query(townsColRef, (await import('firebase/firestore')).where('name', '==', suggestionData.townName)));

    let townId: string;
    let townDataForLocation: Pick<Town, 'id' | 'name' | 'county' | 'country' | 'coordinates' | 'description' | 'imageUrl'>;

    if (townQuerySnapshot.empty) {
      return {
        message: `Town '${suggestionData.townName}' not found. Please create it manually in the 'towns' collection in Firestore (with all required fields: name, county, country, coordinates, description, imageUrl (optional)) before approving this suggestion. Ensure the 'name' field exactly matches '${suggestionData.townName}'.`,
        type: 'error',
        suggestionId
      };
    } else {
      const existingTownDoc = townQuerySnapshot.docs[0];
      townId = existingTownDoc.id;
      const data = existingTownDoc.data();
      townDataForLocation = {
        id: existingTownDoc.id,
        name: data.name,
        county: data.county,
        country: data.country,
        coordinates: data.coordinates,
        description: data.description,
        imageUrl: data.imageUrl,
      };
    }

    let publishedLocationId: string | undefined = suggestionData.publishedLocationId;

    await runTransaction(db, async (transaction) => {
      const transSuggestionSnap = await transaction.get(suggestionRef);
      if (!transSuggestionSnap.exists()) {
        throw new Error("Suggestion not found within transaction.");
      }
      const currentSuggestionData = transSuggestionSnap.data() as NewLocationSuggestion;

      if (currentSuggestionData.status === 'pending' || (currentSuggestionData.status === 'approved' && !currentSuggestionData.publishedLocationId)) {
          if (!currentSuggestionData.publishedLocationId) {
            const newLocationRef = doc(collection(db, 'locations'));
            publishedLocationId = newLocationRef.id;

            const newLocationData: Omit<Location, 'id' | 'createdAt' | 'approvedAt' | 'votes' | 'imageUrl'> & { imageUrl: string | null } = {
              townId: townId,
              townName: townDataForLocation.name,
              name: suggestionData.name,
              description: suggestionData.description,
              imageUrl: suggestionData.imageUrl || null,
              category: suggestionData.category || null,
              issueStatus: suggestionData.issueStatus || 'reported',
              coordinates: suggestionData.coordinates,
              submittedBy: suggestionData.suggesterName,
              createdAtFirestore: suggestionData.submittedAtFirestore,
              approvedAtFirestore: serverTimestamp(),
            };
            transaction.set(newLocationRef, { 
              ...newLocationData, 
              votes: { neutral: 0, positive: 0, fantastic: 0 },
            });
          } else {
            publishedLocationId = currentSuggestionData.publishedLocationId;
          }

          transaction.update(suggestionRef, {
            status: 'approved',
            approvedAtFirestore: serverTimestamp(),
            publishedLocationId: publishedLocationId,
          });
      } else if (currentSuggestionData.status === 'approved' && currentSuggestionData.publishedLocationId) {
         publishedLocationId = currentSuggestionData.publishedLocationId;
         transaction.update(suggestionRef, {
            approvedAtFirestore: serverTimestamp(),
         });
      } else if (currentSuggestionData.status === 'rejected') {
        throw new Error(`Suggestion status changed to 'rejected' during processing. It may have been processed by another administrator.`);
      }
    });

    // Static export: no server revalidation. Clients should update UI after write.

    return {
      message: `Suggestion "${suggestionData.name}" for ${suggestionData.townName} successfully processed. Location ID: ${publishedLocationId}.`,
      type: 'success',
      suggestionId
    };

  } catch (error: any) {
    console.error("Error in approveSuggestion action:", error);
    let errorMessage = error.message.includes('Firebase Admin SDK')
        ? "Server is not configured for this action."
        : `Error: ${error.message || 'Failed to approve and publish suggestion.'}`;
    return {
      message: errorMessage,
      type: 'error',
      suggestionId
    };
  }
}

export interface EditSuggestionFormState {
  message: string;
  type: 'success' | 'error' | 'info';
  suggestionId?: string;
}

export async function editSuggestion(
  prevState: EditSuggestionFormState | undefined,
  formData: FormData
): Promise<EditSuggestionFormState> {
  const suggestionId = formData.get('suggestionId') as string;
  if (!suggestionId) {
    return { message: 'Suggestion ID is missing.', type: 'error' };
  }

  const updates: Record<string, any> = {};
  const name = formData.get('name') as string | null;
  const description = formData.get('description') as string | null;
  const category = formData.get('category') as string | null;
  const issueStatus = formData.get('issueStatus') as string | null;
  const suggesterName = formData.get('suggesterName') as string | null;

  if (name !== null) updates.name = name;
  if (description !== null) updates.description = description;
  if (category !== null) updates.category = category;
  if (issueStatus !== null) updates.issueStatus = issueStatus;
  if (suggesterName !== null) updates.suggesterName = suggesterName;

  try {
    const suggestionRef = doc(db, 'suggestedLocations', suggestionId);
    const snap = await getDoc(suggestionRef);
    if (!snap.exists()) {
      return { message: 'Suggestion not found.', type: 'error', suggestionId };
    }

    await updateDoc(suggestionRef, {
      ...updates,
      updatedAtFirestore: serverTimestamp(),
    });

    // After update, optionally approve & publish if requested
    const approveFlag = formData.get('approve') as string | null;
    if (approveFlag === 'true') {
      // Call existing approveSuggestion flow to publish the suggestion
      const approveFormData = new FormData();
      approveFormData.append('suggestionId', suggestionId);
      const approveResult = await approveSuggestion(undefined, approveFormData);
      // approveSuggestion will revalidate paths itself
      return { message: approveResult.message, type: approveResult.type, suggestionId };
    }

    // Static export: no server revalidation.
    return { message: 'Suggestion updated successfully.', type: 'success', suggestionId };

  } catch (error: any) {
    console.error('[Admin Action] editSuggestion failed:', error);
    const errorMessage = error.message?.includes('Firebase Admin SDK')
      ? 'Server is not configured for this action.'
      : (error.message || 'Failed to update suggestion.');
    return { message: errorMessage, type: 'error', suggestionId };
  }
}


export interface DeleteSuggestionFormState {
  message: string;
  type: 'success' | 'error' | 'info';
  suggestionId?: string;
}

export async function deleteSuggestion(
  prevState: DeleteSuggestionFormState | undefined,
  formData: FormData
): Promise<DeleteSuggestionFormState> {
  const suggestionId = formData.get('suggestionId') as string;
  
  if (!suggestionId) {
    return { message: "Suggestion ID is missing.", type: 'error', suggestionId };
  }

  try {
    const suggestionDocRef = doc(db, 'suggestedLocations', suggestionId);
    await deleteDoc(suggestionDocRef);
    console.log(`[Admin Action] Successfully deleted Firestore document '${suggestionId}'.`);

    return { message: "Suggestion document deleted successfully.", type: 'success', suggestionId };

  } catch (error: any) {
    console.error(`[Admin Action] Failed to delete Firestore document '${suggestionId}':`, error);
    const errorMessage = error.message.includes('Firebase Admin SDK')
        ? "Server is not configured for this action."
        : `Failed to delete suggestion document: ${error.message}.`;
    return { message: errorMessage, type: 'error', suggestionId };
  }
}

// --- Voting System Action ---
export interface CastVoteFormState {
    message: string;
    type: 'success' | 'error' | 'info';
    locationId?: string;
    voteType?: string;
}

const CastVoteSchema = z.object({
  locationId: z.string().min(1, "Location ID is required."),
  voteType: z.enum(["neutral", "positive", "fantastic"], {
    errorMap: () => ({ message: "Invalid vote type specified." }),
  }),
  suggesterUid: z.string().min(1, "User ID is missing.").optional(),
});

export async function castVote(
  prevState: CastVoteFormState | undefined,
  formData: FormData
): Promise<CastVoteFormState> {
  const rawData = {
    locationId: formData.get('locationId'),
    voteType: formData.get('voteType'),
    suggesterUid: (formData.get('suggesterUid') as string | null) || undefined,
  };

  const validatedFields = CastVoteSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    const message = errorMessages.locationId?.[0] || errorMessages.voteType?.[0] || "Invalid vote data provided.";
    return {
      message: message,
      type: 'error',
    };
  }

  const { locationId, voteType, suggesterUid } = validatedFields.data;
  const fieldToIncrement = `votes.${voteType}`;

  try {
    if (suggesterUid) {
      const dailyLimitCheck = await checkAndIncrementAnonymousUserDailyLimit(
        suggesterUid, 
        ANONYMOUS_USER_DAILY_VOTE_LIMIT, 
        'userDailyVoteLimits', 
        'lastVoteDate'
      );
      if (!dailyLimitCheck.allowed) {
        return {
          message: dailyLimitCheck.message || "Daily vote limit reached.",
          type: 'error',
          locationId
        };
      }
    }

    const locationRef = doc(db, 'locations', locationId);

    await runTransaction(db, async (transaction) => {
      const locationDoc = await transaction.get(locationRef);
      if (!locationDoc.exists()) {
        throw new Error("Location not found.");
      }

      const locationData = locationDoc.data();
      if (!locationData?.votes) {
        transaction.update(locationRef, {
          votes: { neutral: 0, positive: 0, fantastic: 0 }
        });
      }

      transaction.update(locationRef, {
        [fieldToIncrement]: increment(1)
      });
    });

    // Static-export site: no server revalidation. Clients should refresh their UI as needed.

    return {
      message: "Vote cast successfully!",
      type: 'success',
      locationId,
      voteType,
    };

  } catch (error: any) {
    console.error(`[Action:castVote] Error casting vote for location ${locationId}:`, error);
    const errorMessage = error.message.includes('Firebase Admin SDK')
        ? "Server is not configured for this action."
        : error.message || "An unexpected error occurred while casting your vote.";
    return {
      message: errorMessage,
      type: 'error',
      locationId,
      voteType,
    };
  }
}
