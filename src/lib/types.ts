
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

export interface Location {
  id: string; // Firestore document ID
  townId: string;
  townName: string; // Denormalized for convenience
  name: string;
  description: string;
  coordinates: Coordinates;
  submittedBy: string; // From suggesterName
  createdAt: string; // ISO date string, populated when location is created from suggestion
  createdAtFirestore?: any; // For Firestore serverTimestamp
  approvedAt?: string; // ISO date string, populated when location is approved
  approvedAtFirestore?: any; // For Firestore serverTimestamp
  votes?: { // Added for the new voting system
    neutral: number;
    positive: number;
    fantastic: number;
  };
  imageUrl?: string | null;
  category?: string;
  issueStatus?: 'reported' | 'improved';
}

// For form validation and submission to 'suggestedLocations'
export interface NewLocationSuggestion {
  id?: string; // Firestore document ID, added when fetching
  name: string;
  description: string;
  townName: string;
  suggesterName: string;
  status: 'pending' | 'approved' | 'rejected';
  // Category chosen by the suggester (e.g. Overgrown Pavement, Speeding)
  category?: string;
  // Issue status from the suggester's perspective: reported (needs improvement) or improved
  issueStatus?: 'reported' | 'improved';
  submittedAt: string; // ISO date string
  submittedAtFirestore?: any; // For Firestore serverTimestamp, will be converted to submittedAt
  approvedAt?: string; // ISO date string, populated when suggestion is approved
  approvedAtFirestore?: any;
  publishedLocationId?: string; // ID of the location document created from this suggestion
  coordinates: Coordinates;
  imageUrl?: string | null; // For uploaded image URL, allow null
}
