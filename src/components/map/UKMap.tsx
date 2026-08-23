'use client';

import L, { type Map as LeafletMapClass } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';
import { createCategoryMarkerIcon } from '@/lib/map-markers';
import { Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface IssueItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  status?: 'reported' | 'resolved' | string;
  locationName?: string;
  latitude?: number | string;
  longitude?: number | string;
  coordinates?: {
    lat: number | string;
    lng: number | string;
  };
  createdAt?: string;
}

interface FormbyMapProps {
  issues: IssueItem[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
}

export default function UKMap({ issues, selectedIssueId, onSelectIssue }: FormbyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapClass | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const formbyCenter: L.LatLngExpression = [53.559, -3.069];
  const formbyZoom = 14;

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: false,
      }).setView(formbyCenter, formbyZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.invalidateSize();

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const validLatLngs: L.LatLngExpression[] = [];

    issues.forEach((issue) => {
      const rawLat = issue.latitude ?? issue.coordinates?.lat;
      const rawLng = issue.longitude ?? issue.coordinates?.lng;

      const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : Number(rawLat);
      const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : Number(rawLng);

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const isResolved = issue.status === 'resolved';
        const isSelected = issue.id === selectedIssueId;

        let icon: L.Icon | L.DivIcon;
        try {
          icon = createCategoryMarkerIcon(issue.category, isResolved, isSelected);
        } catch (err) {
          console.warn('Falling back to default marker icon:', err);
          icon = new L.Icon.Default();
        }

        const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current!);
        validLatLngs.push([lat, lng]);

        const titleText = issue.title || 'Reported Issue';
        const locationText = issue.locationName || 'Formby';

        const popupHtml =
          '<div style="font-family: sans-serif; padding: 4px; min-width: 160px;">' +
          '<strong style="font-size: 1.05em; color: #0f172a;">' + titleText + '</strong><br/>' +
          '<span style="font-size: 0.85em; color: #64748b;">' + locationText + '</span><br/>' +
          '<span style="font-size: 0.8em; color: #0284c7; display: inline-block; margin-top: 6px; font-weight: 500;">' +
          'Details shown below map &darr;' +
          '</span>' +
          '</div>';

        marker.bindPopup(popupHtml);

        marker.on('click', () => {
          onSelectIssue(issue.id);
        });

        markersRef.current[issue.id] = marker;
      }
    });

    if (validLatLngs.length > 0 && !selectedIssueId) {
      const bounds = L.latLngBounds(validLatLngs);
      mapRef.current.fitBounds(bounds, { maxZoom: 15, padding: [30, 30] });
    }
  }, [issues, selectedIssueId, onSelectIssue]);

  useEffect(() => {
    if (selectedIssueId && mapRef.current && markersRef.current[selectedIssueId]) {
      const activeMarker = markersRef.current[selectedIssueId];
      const latLng = activeMarker.getLatLng();
      mapRef.current.panTo(latLng, { animate: true, duration: 0.5 });
      activeMarker.openPopup();
    }
  }, [selectedIssueId]);

  const handleLocateUser = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          mapRef.current?.setView([userLat, userLng], 16);

          L.circleMarker([userLat, userLng], {
            radius: 8,
            fillColor: '#2563eb',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          })
            .addTo(mapRef.current!)
            .bindPopup('Your Current Location')
            .openPopup();
        },
        () => {
          alert('Unable to retrieve your location.');
        }
      );
    }
  };

  return (
    <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden shadow-md border border-border">
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      <Button
        variant="secondary"
        size="sm"
        onClick={handleLocateUser}
        className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur hover:bg-white text-slate-700 shadow border border-slate-200 flex items-center gap-1.5 text-xs font-medium"
      >
        <Locate className="w-3.5 h-3.5 text-blue-600" />
        Locate Me
      </Button>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 md:p-6 pointer-events-none">
        <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow">
          Formby Commons Map
        </h2>
      </div>
    </div>
  );
}
