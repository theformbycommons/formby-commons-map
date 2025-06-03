
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
  postcodeOutcode?: string;
  comments: LocationComment[];
  // status: 'approved' | 'pending'; // Might be useful if suggestedLocations are merged here
}

// For form validation and submission to 'suggestedLocations'
export interface NewLocationSuggestion {
  name: string;
  description: string;
  townName: string;
  postcodeOutcode?: string;
  category: string;
  suggesterName: string;
  suggesterComment?: string;
  // pictureFile is handled by FormData, not directly stored in this type for Firestore
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string; // ISO date string
  coordinates?: Coordinates; // Will be added later, for now can be placeholder
  imageUrl?: string; // For uploaded image URL
}
