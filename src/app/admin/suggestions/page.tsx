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
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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

  if (loading) return <div className="p-6">Loading suggestions...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Location Suggestions</h1>

      {suggestions.length === 0 ? (
        <p>No suggestions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Title / Name</th>
                <th className="border p-2 text-left">Town</th>
                <th className="border p-2 text-left">Submitted By</th>
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion) => {
                const rawDate = 
                  suggestion.submittedAt || 
                  (suggestion as any).submittedAtFirestore || 
                  (suggestion as any).createdAt || 
                  (suggestion as any).createdAtFirestore;

                return (
                  <tr key={suggestion.id} className="hover:bg-gray-50">
                    <td className="border p-2">{suggestion.name}</td>
                    <td className="border p-2">{suggestion.townName || 'N/A'}</td>
                    <td className="border p-2">{suggestion.suggesterName}</td>
                    <td className="border p-2">{formatDate(rawDate)}</td>
                    <td className="border p-2">{suggestion.status}</td>
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
