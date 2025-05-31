
'use client';

import type { Location, Town } from '@/lib/types';
import LocationCard from '@/components/location/LocationCard';
import L, { type Map as LeafletMapClass } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import React, { useEffect, useRef } from 'react';

interface TownMapProps {
  locations: Location[];
  town: Town;
}

export default function TownMap({ locations, town }: TownMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapClass | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: iconRetinaUrl.src,
      iconUrl: iconUrl.src,
      shadowUrl: shadowUrl.src,
    });

    if (mapContainerRef.current && !mapRef.current) {
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

      locations.forEach((location) => {
        const marker = L.marker([location.coordinates.lat, location.coordinates.lng]).addTo(mapRef.current!);
        const popupContent = `
          <div style="font-family: 'PT Sans', sans-serif; padding: 4px;">
            <strong style="font-size: 1.1em; color: hsl(var(--primary));">${location.name}</strong><br/>
            <span style="font-size: 0.9em; color: hsl(var(--muted-foreground));">${location.category}</span><br/>
            <a href="/location/${location.id}" style="color: hsl(var(--accent)); text-decoration: none; font-weight: bold; font-size: 0.95em;">
              View Details &rarr;
            </a>
          </div>
        `;
        marker.bindPopup(popupContent);
      });
      
      // Marker for town center
      const townMarkerIcon = L.icon({
          iconUrl: iconUrl.src,
          iconRetinaUrl: iconRetinaUrl.src,
          shadowUrl: shadowUrl.src,
          iconSize: [25,41],
          iconAnchor: [12,41],
          popupAnchor: [1,-34],
          tooltipAnchor: [16,-28],
          shadowSize: [41,41]
      });
      L.marker(townCenter, { icon: townMarkerIcon })
        .addTo(mapRef.current!)
        .bindPopup(`<strong style="font-family: 'PT Sans', sans-serif; color: hsl(var(--primary));">${town.name} Town Center</strong>`);

    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [locations, town]);

  return (
    <div className="space-y-6">
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
