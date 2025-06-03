
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Town {
  id: string;
  name: string;
  county: string;
  country: string;
  coordinates: Coordinates;
  description: string;
  imageUrl?: string;
  locationCount: number;
}

export interface LocationComment {
  id: string;
  user: string;
  comment: string;
  date: string; // ISO date string
}

export interface Location {
  id: string;
  townId: string;
  townName: string;
  name: string;
  description: string;
  imageUrl?: string;
  category: string;
  coordinates: Coordinates;
  submittedBy: string; // Name of the suggester
  suggesterComment?: string; // Initial comment/note from suggester
  postcodeOutcode?: string; // Added postcode outcode
  comments: LocationComment[];
  rating?: number; // Optional: average rating 0-5
}

// For form validation and submission
export interface NewLocationSuggestion {
  name: string;
  description: string;
  townName: string;
  postcodeOutcode?: string; // Added postcode outcode
  category: string;
  // pictureFile?: FileList; // Handled by FormData server-side, client-side uses FileList type
  suggesterComment?: string;
  suggesterName: string;
}

    