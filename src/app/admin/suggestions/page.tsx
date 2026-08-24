'use client';

import React, { useState, useEffect } from 'react';
import { getSuggestedLocations } from '@/lib/admin-data';
import type { NewLocationSuggestion } from '@/lib/types';

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<NewLocationSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getSuggestedLocations();
        setSuggestions(data || []);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      } font-medium {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Updated date parser to explicitly check for Firestore Timestamp objects or string formats
  const formatDate = (rawDate?: any) => {
    if (!rawDate) return 'N/A';
    try {
      let dateObj: Date | null = null;

      if (typeof rawDate?.toDate === 'function') {
        dateObj = rawDate.toDate();
      } else if (typeof (rawDate?.seconds ?? rawDate?._seconds) === 'number') {
        dateObj = new Date((rawDate.seconds ?? rawDate._seconds) * 1000);
      } else if (rawDate instanceof Date) {
        dateObj = rawDate;
      } else {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          dateObj = parsed;
        }
      }

      if (dateObj) {
        return dateObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      return 'N/A';
    }
    return 'N/A';
  };

  // Helper function to build Google Maps URL from nested Firestore coordinates
  const getGoogleMapsUrl = (coordinates?: { lat: number; lng: number }) => {
    if (
      coordinates &&
      typeof coordinates.lat === 'number' &&
      typeof coordinates.lng === 'number'
    ) {
      return `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
    }
    return null;
  };

  if (loading) return <div className="p-6">Loading suggestions...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Location Suggestions</h1>

      {suggestions.length === 0 ? (
        <p>No suggestions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Title / Name</th>
                <th className="border p-2 text-left">Town</th>
                <th className="border p-2 text-left">Submitted By</th>
                <th className="border p-2 text-left">Location / Map Link</th>
                <th className="border p-2 text-left">Submitted Date</th>
                <th className="border p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion) => {
                // Priority given to 'submittedAtFirestore' as seen in database schema
                const rawDate =
                  (suggestion as any).submittedAtFirestore ||
                  suggestion.submittedAt ||
                  (suggestion as any).createdAt ||
                  (suggestion as any).createdAtFirestore;

                const coords = (suggestion as any).coordinates;
                const mapsUrl = getGoogleMapsUrl(coords);

                return (
                  <tr key={suggestion.id} className="hover:bg-gray-50">
                    <td className="border p-2 font-medium">{suggestion.name}</td>
                    <td className="border p-2">{suggestion.townName || 'N/A'}</td>
                    <td className="border p-2">{suggestion.suggesterName || 'Anonymous'}</td>
                    
                    {/* Coordinates & Google Maps Link */}
                    <td className="border p-2">
                      {mapsUrl && coords ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">
                            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                          </span>
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium text-xs inline-flex items-center gap-1"
                          >
                            Google Maps ↗
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No location</span>
                      )}
                    </td>

                    {/* Submission Date */}
                    <td className="border p-2">{formatDate(rawDate)}</td>
                    <td className="border p-2 capitalize">{suggestion.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
