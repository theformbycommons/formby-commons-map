'use client';

import { useEffect, useRef } from 'react';
import L, { type Map as LeafletMapClass } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface LocationPreviewMapProps {
  lat: number;
  lng: number;
  height?: string;
}

export default function LocationPreviewMap({
  lat,
  lng,
  height = '180px',
}: LocationPreviewMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapClass | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const coords: L.LatLngExpression = [lat, lng];

      mapRef.current = L.map(mapContainerRef.current, {
        center: coords,
        zoom: 15,
        zoomControl: false,
        dragging: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(mapRef.current);

      L.marker(coords).addTo(mapRef.current);
    }
  }, [lat, lng]);

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="space-y-2">
      <div
        ref={mapContainerRef}
        style={{ height }}
        className="w-full rounded-md border border-input overflow-hidden shadow-inner bg-muted pointer-events-none"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-7 text-xs gap-1"
        >
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
            Open in Google Maps
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}
