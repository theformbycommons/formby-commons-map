
'use client';

import type { Location, Town } from '@/lib/types';
import LocationCard from '@/components/location/LocationCard';
import L, { type Map as LeafletMapClass } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';

interface TownMapProps {
  locations: Location[];
  town: Town;
}

export default function TownMap({ locations, town }: TownMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapClass | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'reported' | 'improved'>('all');

  // Map categories to marker colors
  const categoryColor: Record<string, string> = {
    'Overgrown Pavement': '#2b6cb0',
    'Roundabout Improvement Needed': '#d69e2e',
    'Unsafe Crossing': '#dd6b20',
    'Missing Drop Kerb': '#9f7aea',
    'Cars Parked On Pavement': '#e53e3e',
    'Speeding': '#dd2772',
    'Other': '#718096',
  };

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Configure Leaflet icons using CDN paths
      // @ts-ignore Property '_getIconUrl' is private and only accessible within class 'IconDefault'.
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const townCenter: L.LatLngExpression = [town.coordinates.lat, town.coordinates.lng];
      const townZoom = 13;

      mapRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: false,
      }).setView(townCenter, townZoom);

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      ).addTo(mapRef.current);

      // Create a layer group to manage markers for easy clearing when filters change
      if (!markersLayerRef.current) {
        markersLayerRef.current = L.layerGroup().addTo(mapRef.current!);
      }
      // markers will be populated by the filter effect below
      
      // Marker for town center - using default icon which is now configured
      L.marker(townCenter)
        .addTo(mapRef.current!)
        .bindPopup(`<strong style="font-family: 'PT Sans', sans-serif; color: hsl(var(--primary));">${town.name} Town Center</strong>`);

    }
  }, [locations, town]);

  // Initialize selected categories once based on available locations
  useEffect(() => {
    const cats = Array.from(new Set(locations.map(l => l.category || 'Other')));
    if (selectedCategories.length === 0) {
      setSelectedCategories(cats);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  // Update markers when locations or filters change
  useEffect(() => {
    if (!mapRef.current) return;
    if (!markersLayerRef.current) {
      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    markersLayerRef.current.clearLayers();

    locations.forEach((location) => {
      const cat = location.category || 'Other';
      if (selectedCategories.length > 0 && !selectedCategories.includes(cat)) return;
      if (statusFilter !== 'all' && (location.issueStatus || 'reported') !== statusFilter) return;

      const color = categoryColor[cat] || '#3182ce';
      const marker = L.circleMarker([location.coordinates.lat, location.coordinates.lng], {
        radius: 8,
        color: color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 1,
      });

      const popupContent = `
        <div style="font-family: 'PT Sans', sans-serif; padding: 6px; max-width:220px;">
          <strong style="font-size: 1.05em; color: hsl(var(--primary));">${location.name}</strong>
          <div style="font-size:0.85em; color: #334155; margin-top:4px;">${location.description || ''}</div>
          <div style="font-size:0.8em; color:#475569; margin-top:6px;"><strong>Status:</strong> ${location.issueStatus || 'reported'}</div>
          <div style="font-size:0.8em; color:#64748b; margin-top:4px;"><strong>Submitted:</strong> ${location.createdAt ? new Date(location.createdAt).toLocaleString() : 'N/A'}</div>
          <div style="margin-top:6px;"><a href="/location/${location.id}" style="color: hsl(var(--accent)); text-decoration: none; font-weight: 600;">View Details &rarr;</a></div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.bindTooltip(`${location.name} — ${cat}`);
      markersLayerRef.current!.addLayer(marker);
    });
  }, [locations, selectedCategories, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Filters and legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm font-medium">Filter Categories:</div>
          {Array.from(new Set(locations.map(l => l.category || 'Other'))).map((cat) => (
            <label key={cat} className="inline-flex items-center text-sm mr-2">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => {
                  setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
                }}
                className="mr-2"
              />
              {cat}
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium mr-2">Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
            <option value="all">All</option>
            <option value="reported">Reported</option>
            <option value="improved">Improved</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(categoryColor).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-2 text-xs">
            <span style={{ background: color }} className="w-4 h-4 inline-block rounded-sm border" />
            <span className="text-muted-foreground">{cat}</span>
          </div>
        ))}
      </div>
      <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg border border-border">
        <div ref={mapContainerRef} className="h-full w-full z-0" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-center p-6 pointer-events-none">
          <h2 className="text-2xl font-headline font-bold text-white text-center drop-shadow-md">Explore {town.name}</h2>
        </div>
      </div>

      {locations.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No locations found for {town.name}. Be the first to <a href="/suggest-location" className="text-accent hover:underline">suggest one</a>!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      )}
    </div>
  );
}
