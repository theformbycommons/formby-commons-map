
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Town {
  id: string; // Firestore document ID
  name: string;
  county: string;
  country: string;
  coordinates: Coordinates;
  description: string;
  imageUrl?: string;
  locationCount?: number; // Will be calculated, so make it optional from DB perspective
}

export interface LocationComment { // This is for APPROVED comments stored in the Location document
  id: string; 
  user: string;
  comment: string;
  date: string; // ISO date string (Firestore Timestamps will be converted)
}

export interface Location {
  id: string; // Firestore document ID
  townId: string;
  townName: string; // Denormalized for convenience
  name: string;
  description: string;
  imageUrl?: string | null; // Allow null
  category: string;
  coordinates: Coordinates;
  submittedBy: string; // From suggesterName
  comments: LocationComment[]; // Array of APPROVED comments
  createdAt: string; // ISO date string, populated when location is created from suggestion
  createdAtFirestore?: any; // For Firestore serverTimestamp
}

// For form validation and submission to 'suggestedLocations'
export interface NewLocationSuggestion {
  id?: string; // Firestore document ID, added when fetching
  name: string;
  description: string;
  townName: string;
  category: string;
  suggesterName: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string; // ISO date string
  submittedAtFirestore?: any; // For Firestore serverTimestamp, will be converted to submittedAt
  approvedAt?: string; // ISO date string, populated when suggestion is approved
  approvedAtFirestore?: any;
  publishedLocationId?: string; // ID of the document created in 'locations' collection
  coordinates: Coordinates;
  imageUrl?: string | null; // For uploaded image URL, allow null
}

// For new comments awaiting moderation
export interface SuggestedComment {
  id?: string; // Firestore document ID, added when fetching
  locationId: string;
  locationName: string; // Denormalized for easier display in admin UI
  userName: string;
  commentText: string;
  suggesterUid?: string; // If submitted by an anonymous user (for rate limiting etc.)
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string; // ISO date string for client
  submittedAtFirestore?: any; // For Firestore serverTimestamp
  // Optional fields to be added upon moderation:
  approvedAt?: string;
  approvedAtFirestore?: any;
  rejectedAt?: string;
  rejectedAtFirestore?: any;
  // moderatedBy?: string; // Admin user ID/name
  // moderationNotes?: string; // Notes from admin
}
