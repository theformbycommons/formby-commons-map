
import type { Town, Location, LocationComment } from './types';

const today = new Date().toISOString();

export const mockComments: LocationComment[] = [
  { id: 'comment1', user: 'LocalExplorer', comment: 'A truly wonderful spot!', date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'comment2', user: 'VisitorJane', comment: 'Loved the atmosphere here.', date: new Date(Date.now() - 86400000 * 1).toISOString() },
];

export const mockTowns: Town[] = [
  {
    id: 'formby',
    name: 'Formby',
    county: 'Merseyside',
    country: 'UK',
    coordinates: { lat: 53.558, lng: -3.067 },
    description: 'A charming coastal town known for its beautiful beaches, pine woods, and red squirrels.',
    imageUrl: 'https://placehold.co/600x400.png',
    locationCount: 3,
  },
  {
    id: 'windermere',
    name: 'Windermere',
    county: 'Cumbria',
    country: 'UK',
    coordinates: { lat: 54.380, lng: -2.907 },
    description: 'A popular town in the Lake District, offering stunning lake views and outdoor activities.',
    imageUrl: 'https://placehold.co/600x400.png',
    locationCount: 2,
  },
  {
    id: 'stives',
    name: 'St Ives',
    county: 'Cornwall',
    country: 'UK',
    coordinates: { lat: 50.211, lng: -5.480 },
    description: 'A picturesque seaside town famous for its art scene, sandy beaches, and narrow cobbled streets.',
    imageUrl: 'https://placehold.co/600x400.png',
    locationCount: 1,
  },
];

export const mockLocations: Location[] = [
  // Formby Locations
  {
    id: 'formby-beach',
    townId: 'formby',
    townName: 'Formby',
    name: 'Formby Beach',
    description: 'Expansive sandy beach with dramatic dunes, perfect for walks and enjoying coastal views. Look out for prehistoric footprints at low tide!',
    imageUrl: 'https://placehold.co/600x400.png',
    category: 'Nature Spot',
    coordinates: { lat: 53.561, lng: -3.094 },
    submittedBy: 'Admin',
    postcodeOutcode: 'L37',
    suggesterComment: 'A must-visit in Formby.',
    comments: mockComments,
  },
  {
    id: 'formby-red-squirrel-reserve',
    townId: 'formby',
    townName: 'Formby',
    name: 'Formby Red Squirrel Reserve',
    description: 'Beautiful pine woods managed by the National Trust, one of the last refuges for the native red squirrel in the UK.',
    imageUrl: 'https://placehold.co/600x400.png',
    category: 'Park',
    coordinates: { lat: 53.552, lng: -3.080 },
    submittedBy: 'Admin',
    postcodeOutcode: 'L37',
    comments: [{id: 'c3', user: 'NatureLover22', comment: 'Saw three red squirrels! Magical.', date: today}],
  },
  {
    id: 'the-railway-formby',
    townId: 'formby',
    townName: 'Formby',
    name: 'The Railway Formby',
    description: 'A traditional pub offering a wide range of ales and hearty food, located near Formby station.',
    imageUrl: 'https://placehold.co/600x400.png',
    category: 'Pub / Restaurant',
    coordinates: { lat: 53.558, lng: -3.064 },
    submittedBy: 'Admin',
    postcodeOutcode: 'L37',
    comments: [],
  },
  // Windermere Locations
  {
    id: 'lake-windermere-cruises',
    townId: 'windermere',
    townName: 'Windermere',
    name: 'Lake Windermere Cruises',
    description: 'Enjoy a scenic boat trip on England\'s largest natural lake, with various routes and stopping points.',
    imageUrl: 'https://placehold.co/600x400.png',
    category: 'Attraction',
    coordinates: { lat: 54.374, lng: -2.911 },
    submittedBy: 'Admin',
    postcodeOutcode: 'LA23',
    comments: [],
  },
  {
    id: 'orrest-head',
    townId: 'windermere',
    townName: 'Windermere',
    name: 'Orrest Head Viewpoint',
    description: 'A relatively easy walk from Windermere town leading to a viewpoint with panoramic views of the lake and surrounding fells.',
    imageUrl: 'https://placehold.co/600x400.png',
    category: 'Viewpoint',
    coordinates: { lat: 54.386, lng: -2.900 },
    submittedBy: 'Admin',
    postcodeOutcode: 'LA23',
    comments: [],
  },
  // St Ives Locations
  {
    id: 'tate-st-ives',
    townId: 'stives',
    townName: 'St Ives',
    name: 'Tate St Ives',
    description: 'An art gallery exhibiting modern and contemporary art, with a focus on artists associated with St Ives. Stunning architecture and sea views.',
    imageUrl: 'https://placehold.co/600x400.png',
    category: 'Gallery / Museum',
    coordinates: { lat: 50.216, lng: -5.480 },
    submittedBy: 'Admin',
    postcodeOutcode: 'TR26',
    comments: [],
  },
];

// Simulated API functions
export async function getTowns(): Promise<Town[]> {
  return new Promise(resolve => setTimeout(() => resolve(mockTowns), 500));
}

export async function getTownByName(name: string): Promise<Town | undefined> {
  const decodedName = decodeURIComponent(name);
  return new Promise(resolve => setTimeout(() => resolve(mockTowns.find(town => town.name.toLowerCase() === decodedName.toLowerCase())), 300));
}

export async function getLocationsByTownId(townId: string): Promise<Location[]> {
  return new Promise(resolve => setTimeout(() => resolve(mockLocations.filter(location => location.townId === townId)), 500));
}

export async function getLocationById(id: string): Promise<Location | undefined> {
  return new Promise(resolve => setTimeout(() => resolve(mockLocations.find(location => location.id === id)), 300));
}

// For Suggest New Location - this would interact with a database in a real app
export async function addSuggestedLocation(locationData: Omit<Location, 'id' | 'comments'>): Promise<Location> {
  console.log("Mock submitting location:", locationData);
  const newLocation: Location = {
    ...locationData,
    id: `new-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    comments: locationData.suggesterComment ? [{id: 'suggester-comment', user: locationData.submittedBy, comment: locationData.suggesterComment, date: new Date().toISOString()}] : [],
    postcodeOutcode: locationData.postcodeOutcode, // Ensure postcode is passed
  };
  // In a real app, this would be saved to a staging/approval database
  // For mock purposes, we can add it to the list if needed for immediate feedback, or just log it.
  // mockLocations.push(newLocation); 
  return new Promise(resolve => setTimeout(() => resolve(newLocation), 700));
}

export const locationCategories = [
  "Park",
  "Nature Spot",
  "Cafe",
  "Restaurant",
  "Pub / Restaurant",
  "Shop",
  "Landmark",
  "Viewpoint",
  "Museum",
  "Gallery / Museum",
  "Attraction",
  "Historical Site",
  "Accommodation",
  "Other"
];
