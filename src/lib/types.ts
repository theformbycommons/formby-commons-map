export interface SuggestedLocation {
  id: string;
  name: string; // Action/Issue title
  description?: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | string; // Admin approval lifecycle
  issueStatus: 'reported' | 'resolved' | string; // Fix lifecycle
  townName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  // Accepts ISO strings, raw numbers, or raw Firestore Timestamp objects
  submittedAt?: string | number | { seconds: number; nanoseconds?: number } | any;
  createdAt?: string | number | { seconds: number; nanoseconds?: number } | any; 
  suggesterName?: string;
  imageUrl?: string | null;
}
