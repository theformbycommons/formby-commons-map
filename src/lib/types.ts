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
  submittedAt?: string;
  suggesterName?: string;
  imageUrl?: string | null;
}
