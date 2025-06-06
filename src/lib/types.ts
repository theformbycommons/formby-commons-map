
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

export interface LocationComment {
  id: string; // Can be a unique ID or index if stored as an array
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
  imageUrl?: string;
  category: string;
  coordinates: Coordinates;
  submittedBy: string;
  suggesterComment?: string;
  postcodeOutcode?: string; // Keep for existing approved locations, but won't be added for new ones
  comments: LocationComment[];
}

// For form validation and submission to 'suggestedLocations'
export interface NewLocationSuggestion {
  id?: string; // Firestore document ID, added when fetching
  name: string;
  description: string;
  townName: string;
  // postcodeOutcode removed
  category: string;
  suggesterName: string;
  suggesterComment?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string; // ISO date string
  submittedAtFirestore?: any; // For Firestore serverTimestamp, will be converted to submittedAt
  coordinates: Coordinates;
  imageUrl?: string; // For uploaded image URL
}
