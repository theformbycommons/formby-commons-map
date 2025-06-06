
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
  submittedBy: string; // From suggesterName
  suggesterComment?: string;
  // postcodeOutcode is intentionally omitted for new locations
  comments: LocationComment[];
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
  suggesterComment?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string; // ISO date string
  submittedAtFirestore?: any; // For Firestore serverTimestamp, will be converted to submittedAt
  approvedAt?: string; // ISO date string, populated when suggestion is approved
  approvedAtFirestore?: any; // For Firestore serverTimestamp
  publishedLocationId?: string; // ID of the document created in 'locations' collection
  coordinates: Coordinates;
  imageUrl?: string; // For uploaded image URL
}
