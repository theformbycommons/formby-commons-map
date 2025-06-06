
'use client';

import { useEffect, useRef, useState } from 'react';
import L, { type Map as LeafletMapClass, type LeafletMouseEvent, type Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin as MapPinIcon } from 'lucide-react'; // Renamed to avoid conflict if MapPin is used elsewhere

// Default Leaflet icon setup
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
  value: { lat: number; lng: number } | null; // Controlled component: current coordinates
  onValueChange: (coords: { lat: number; lng: number } | null) => void; // Callback to update parent state
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

  // Effect for one-time map initialization
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const ukCenter: L.LatLngExpression = value ? [value.lat, value.lng] : [54.5, -2.5];
      const initialZoom = value ? 13 : 6;

      mapRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
      }).setView(ukCenter, initialZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // Handle initial marker if value is provided
      if (value) {
        markerRef.current = L.marker(value, { draggable: true }).addTo(mapRef.current);
        markerRef.current.on('dragend', (event) => {
          onValueChange(event.target.getLatLng());
        });
      }

      // Handle map click
      mapRef.current.on('click', (event: LeafletMouseEvent) => {
        const coords = event.latlng;
        onValueChange(coords); // This will trigger the value prop update, then the useEffect below
      });
    }
    
    // Cleanup not strictly needed here as map instance is stable within form lifecycle
    // If component was frequently unmounted/remounted, cleanup would be:
    // return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []); // Empty dependency array for one-time setup

  // Effect to react to external 'value' prop changes (making it a controlled component)
  useEffect(() => {
    if (!mapRef.current) return; // Map not initialized yet

    if (value) { // Parent wants to set/update coordinates
      if (markerRef.current) { // Marker exists, update its position
        const currentMarkerPos = markerRef.current.getLatLng();
        if (currentMarkerPos.lat !== value.lat || currentMarkerPos.lng !== value.lng) {
          markerRef.current.setLatLng(value);
        }
      } else { // No marker, create one
        markerRef.current = L.marker(value, { draggable: true }).addTo(mapRef.current);
        markerRef.current.on('dragend', (event) => {
          onValueChange(event.target.getLatLng());
        });
      }
      mapRef.current.panTo(value); // Pan to the new coordinates
    } else { // Parent wants to clear coordinates (value is null)
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [value, onValueChange]); // React to external value changes and ensure onValueChange is stable

  return (
    <div className="space-y-2">
      <div
        ref={mapContainerRef}
        style={{ height: mapHeight }}
        className="w-full rounded-md border border-input shadow-sm bg-muted cursor-crosshair"
        role="application"
        aria-label="Interactive map for picking location"
      />
      <Alert variant={value ? "default" : "destructive"} className={value ? "border-green-300 bg-green-50 text-green-700" : ""}>
        <MapPinIcon className={`h-4 w-4 ${value ? "text-green-700" : ""}`} />
        <AlertDescription>
          {value
            ? `Selected: Lat ${value.lat.toFixed(5)}, Lng ${value.lng.toFixed(5)}`
            : 'Please click on the map to set the precise location. This is required.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
