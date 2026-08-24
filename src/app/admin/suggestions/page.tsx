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

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
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
              {suggestions.map((suggestion) => (
                <tr key={suggestion.id} className="hover:bg-gray-50">
                  <td className="border p-2">{suggestion.name}</td>
                  <td className="border p-2">{suggestion.townName || 'N/A'}</td>
                  <td className="border p-2">{suggestion.suggesterName}</td>
                  <td className="border p-2">{formatDate(suggestion.submittedAt)}</td>
                  <td className="border p-2">{suggestion.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
