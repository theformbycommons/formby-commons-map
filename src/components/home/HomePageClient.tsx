'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CATEGORIES, getCategoryConfig } from '@/lib/categories';
import { getApprovedLocations } from '@/lib/firestore-actions';
import type { SuggestedLocation } from '@/lib/types';
import type { IssueItem } from '@/components/map/UKMap';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search, ChevronDown, ChevronUp, CheckCircle, AlertCircle, MapPin, Loader2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const UKMap = dynamic(() => import('@/components/map/UKMap'), {
  ssr: false,
  loading: () => (
    <div className="h-72 md:h-96 w-full bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400 text-xs">
      Loading Formby Map...
    </div>
  ),
});

interface HomePageClientProps {
  initialIssues?: IssueItem[];
}

export default function HomePageClient({ initialIssues = [] }: HomePageClientProps) {
  const [issues, setIssues] = useState<IssueItem[]>(initialIssues);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reported' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    async function loadApprovedLocations() {
      setIsLoading(true);
      try {
        const approvedLocations: SuggestedLocation[] = await getApprovedLocations();

        const mappedIssues: IssueItem[] = approvedLocations
          .map((loc: any) => {
            const rawLat = loc.latitude ?? loc.lat ?? loc.coordinates?.lat ?? loc.location?.latitude;
            const rawLng = loc.longitude ?? loc.lng ?? loc.coordinates?.lng ?? loc.location?.longitude;

            const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : Number(rawLat);
            const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : Number(rawLng);

            if (isNaN(lat) || isNaN(lng)) return null;

            return {
              id: loc.id,
              title: loc.name || loc.title || 'Reported Action',
              description: loc.description || '',
              category: loc.category || 'other',
              locationName: loc.locationName || 'Formby',
              latitude: lat,
              longitude: lng,
              coordinates: { lat, lng },
              status: (loc.issueStatus as 'reported' | 'resolved') || 'reported',
              createdAt: loc.submittedAt || loc.createdAt,
            };
          })
          .filter((item): item is IssueItem => item !== null);

        setIssues(mappedIssues);
      } catch (error) {
        console.error('Error fetching approved map points:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadApprovedLocations();
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedCategory !== 'all') {
        const normCategory = issue.category?.toLowerCase().replace(/\s+/g, '-');
        if (normCategory !== selectedCategory) return false;
      }

      if (statusFilter !== 'all') {
        const isResolved = issue.status === 'resolved';
        if (statusFilter === 'resolved' && !isResolved) return false;
        if (statusFilter === 'reported' && isResolved) return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const titleMatch = issue.title?.toLowerCase().includes(q);
        const descMatch = issue.description?.toLowerCase().includes(q);
        const locationMatch = issue.locationName?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !locationMatch) return false;
      }

      return true;
    });
  }, [issues, selectedCategory, statusFilter, searchQuery]);

  const handleSelectFromMap = (id: string) => {
    setSelectedIssueId((prev) => (prev === id ? null : id));
    if (rowRefs.current[id]) {
      rowRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIssueId((prev) => (prev === id ? null : id));
  };

  const formatSubmissionDate = (rawDate?: any) => {
    if (!rawDate) return null;
    try {
      if (typeof rawDate === 'string') {
        return format(parseISO(rawDate), 'dd MMM yyyy');
      }
      if (typeof rawDate === 'number') {
        return format(new Date(rawDate), 'dd MMM yyyy');
      }
      if (rawDate.toDate && typeof rawDate.toDate === 'function') {
        return format(rawDate.toDate(), 'dd MMM yyyy');
      }
      if (rawDate instanceof Date) {
        return format(rawDate, 'dd MMM yyyy');
      }
    } catch {
      return null;
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          The Formby Commons Actions Map
        </h1>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl">
          A community platform mapping local public space safety concerns across Formby. Filter by issue type or tap a marker to inspect and follow progress.
        </p>
      </div>

      <div className="space-y-4 bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Show Status:
          </span>
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('reported')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === 'reported'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reported Only
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolved / Improved
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Filter Category:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Categories ({issues.length})
            </button>
            {Object.values(CATEGORIES).map((cat) => {
              const count = issues.filter(
                (i) => i.category?.toLowerCase().replace(/\s+/g, '-') === cat.id
              ).length;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  style={{
                    backgroundColor: isActive ? cat.color : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: isActive ? '#ffffff' : cat.color }}
                  />
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <UKMap
        issues={filteredIssues}
        selectedIssueId={selectedIssueId}
        onSelectIssue={handleSelectFromMap}
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Reported Locations</span>
            <Badge variant="secondary" className="text-xs font-medium">
              {filteredIssues.length}
            </Badge>
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by street or detail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-white border-slate-200"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            Loading approved map submissions...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-500 text-sm">No issues matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredIssues.map((issue) => {
              const isExpanded = selectedIssueId === issue.id;
              const catConfig = getCategoryConfig(issue.category);
              const isResolved = issue.status === 'resolved';
              const formattedDate = formatSubmissionDate(issue.createdAt);

              return (
                <Card
                  key={issue.id}
                  ref={(el) => {
                    rowRefs.current[issue.id] = el;
                  }}
                  className={`transition-all duration-200 border ${
                    isExpanded
                      ? 'ring-2 ring-slate-900 border-transparent shadow-md'
                      : 'hover:border-slate-300'
                  }`}
                >
                  <CardHeader
                    onClick={() => handleToggleRow(issue.id)}
                    className="p-4 cursor-pointer select-none flex flex-row items-center justify-between space-y-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: catConfig.color }}
                        title={catConfig.label}
                      />
                      <div>
                        <CardTitle className="text-sm font-semibold text-slate-900">
                          {issue.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {issue.locationName || 'Formby'}
                          </span>
                          <span>•</span>
                          <span>{catConfig.label}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`text-xs flex items-center gap-1 font-medium ${
                          isResolved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isResolved ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Resolved
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Reported
                          </>
                        )}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="px-4 pb-4 pt-0 border-t border-slate-100 text-xs text-slate-600 space-y-3 mt-2">
                      <p className="leading-relaxed text-slate-700 pt-2">
                        {issue.description || 'No detailed description provided.'}
                      </p>

                      {formattedDate && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Submitted on {formattedDate}</span>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
