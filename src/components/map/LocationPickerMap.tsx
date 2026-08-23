'use client';

import { useEffect, useRef } from 'react';
import L, { type Map as LeafletMapClass, type LeafletMouseEvent, type Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin as MapPinIcon } from 'lucide-react';
import { FORMBY_BOUNDS, FORMBY_LEAFLET_BOUNDS, isWithinFormby } from '@/lib/map-config';

if (typeof window !== 'undefined') {
  // @ts-ignore Property '_getIconUrl' is private and only accessible within class 'IconDefault'.
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface LocationPickerMapProps {
  value: { lat: number; lng: number } | null;
  onValueChange: (coords: { lat: number; lng: number } | null) => void;
  mapHeight?: string;
}

export default function LocationPickerMap({
  value,
  onValueChange,
  mapHeight = '300px',
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapClass | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const initialCenter: L.LatLngExpression = value 
        ? [value.lat, value.lng] 
        : [FORMBY_BOUNDS.center.lat, FORMBY_BOUNDS.center.lng];
      const initialZoom = value ? 14 : FORMBY_BOUNDS.defaultZoom;
      const leafletBounds = L.latLngBounds(FORMBY_LEAFLET_BOUNDS);

      mapRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
        maxBounds: leafletBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 12,
      }).setView(initialCenter, initialZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        bounds: leafletBounds,
      }).addTo(mapRef.current);

      if (value && isWithinFormby(value.lat, value.lng)) {
        markerRef.current = L.marker(value, { draggable: true }).addTo(mapRef.current);
        markerRef.current.on('dragend', (event) => {
          const pos = event.target.getLatLng();
          if (isWithinFormby(pos.lat, pos.lng)) {
            onValueChange({ lat: pos.lat, lng: pos.lng });
          } else if (value) {
            event.target.setLatLng(value);
          }
        });
      }

      mapRef.current.on('click', (event: LeafletMouseEvent) => {
        const coords = event.latlng;
        if (isWithinFormby(coords.lat, coords.lng)) {
          onValueChange({ lat: coords.lat, lng: coords.lng });
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (value && isWithinFormby(value.lat, value.lng)) {
      if (markerRef.current) {
        const currentMarkerPos = markerRef.current.getLatLng();
        if (currentMarkerPos.lat !== value.lat || currentMarkerPos.lng !== value.lng) {
          markerRef.current.setLatLng(value);
        }
      } else {
        markerRef.current = L.marker(value, { draggable: true }).addTo(mapRef.current);
        markerRef.current.on('dragend', (event) => {
          const pos = event.target.getLatLng();
          if (isWithinFormby(pos.lat, pos.lng)) {
            onValueChange({ lat: pos.lat, lng: pos.lng });
          } else if (value) {
            event.target.setLatLng(value);
          }
        });
      }
      mapRef.current.panTo(value);
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [value, onValueChange]);

  return (
    <div className="space-y-2">
      <div
        ref={mapContainerRef}
        style={{ height: mapHeight }}
        className="w-full rounded-md border border-input shadow-sm bg-muted cursor-crosshair"
        role="application"
        aria-label="Interactive map for picking location in Formby"
      />
      <Alert className={value ? "border-green-300 bg-green-50 text-green-700" : "bg-muted/50 text-muted-foreground border-border"}>
        <MapPinIcon className={`h-4 w-4 ${value ? "text-green-700" : "text-muted-foreground"}`} />
        <AlertDescription>
          {value
            ? `Selected: Lat ${value.lat.toFixed(5)}, Lng ${value.lng.toFixed(5)}`
            : 'Click on the map to place a pin within Formby.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
