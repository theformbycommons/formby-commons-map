'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { getSuggestedLocations } from '@/lib/admin-data';

interface Suggestion {
  id: string;
  name?: string;
  locationName?: string;
  title?: string;
  category?: string;
  description?: string;
  address?: string;
  submittedBy?: string;
  email?: string;
  status?: string;
  submittedAtFirestore?: any;
  submittedAt?: any;
  createdAt?: any;
  timestamp?: any;
  date?: any;
  [key: string]: any;
}

function formatSubmissionDate(rawDate?: any): string {
  if (!rawDate) return 'N/A';

  try {
    // 1. Direct Firestore Timestamp object with .toDate()
    if (typeof rawDate?.toDate === 'function') {
      return format(rawDate.toDate(), 'dd MMM yyyy, HH:mm');
    }

    // 2. Serialized Firestore Timestamp object ({ _seconds, _nanoseconds } or { seconds, nanoseconds })
    const seconds = rawDate?.seconds ?? rawDate?._seconds;
    if (typeof seconds === 'number') {
      return format(new Date(seconds * 1000), 'dd MMM yyyy, HH:mm');
    }

    // 3. String date handling (ISO or general date string)
    if (typeof rawDate === 'string') {
      const parsed = parseISO(rawDate);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, 'dd MMM yyyy, HH:mm');
      }
      const direct = new Date(rawDate);
      if (!isNaN(direct.getTime())) {
        return format(direct, 'dd MMM yyyy, HH:mm');
      }
    }

    // 4. Numeric timestamp in milliseconds
    if (typeof rawDate === 'number') {
      return format(new Date(rawDate), 'dd MMM yyyy, HH:mm');
    }

    // 5. Standard JS Date object
    if (rawDate instanceof Date) {
      return format(rawDate, 'dd MMM yyyy, HH:mm');
    }
  } catch (e) {
    console.warn('Date formatting error:', e);
  }

  return 'N/A';
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
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

  if (loading) {
    return <div className="p-6">Loading suggestions...</div>;
  }

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
                <th className="border p-2 text-left">Category</th>
                <th className="border p-2 text-left">Submitted By</th>
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion) => {
                const rawSubmissionDate =
                  suggestion.submittedAtFirestore ??
                  (suggestion as any).submittedAtFirestore ??
                  suggestion.submittedAt ??
                  (suggestion as any).createdAt ??
                  (suggestion as any).timestamp ??
                  (suggestion as any).date;

                const formattedDate = formatSubmissionDate(rawSubmissionDate);

                return (
                  <tr key={suggestion.id} className="hover:bg-gray-50">
                    <td className="border p-2">
                      {suggestion.locationName || suggestion.name || suggestion.title || 'Untitled'}
                    </td>
                    <td className="border p-2">{suggestion.category || 'N/A'}</td>
                    <td className="border p-2">
                      {suggestion.submittedBy || suggestion.email || 'Anonymous'}
                    </td>
                    <td className="border p-2">{formattedDate}</td>
                    <td className="border p-2">{suggestion.status || 'Pending'}</td>
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
