'use client';

import type { Town } from '@/lib/types';
import L, { type Map as LeafletMapClass } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Eye } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

interface UKMapProps {
  towns: Town[];
}

export default function UKMap({ towns }: UKMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapClass | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // @ts-ignore Property '_getIconUrl' is private and only accessible within class 'IconDefault'.
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const formbyCenter: L.LatLngExpression = [53.559, -3.069];
      const formbyZoom = 13;

      mapRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: false,
      }).setView(formbyCenter, formbyZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      towns.forEach((town) => {
        if (town.coordinates) {
          const marker = L.marker([town.coordinates.lat, town.coordinates.lng]).addTo(mapRef.current!);
          const popupHtml = '<div style="font-family: sans-serif; padding: 4px;">' +
            '<strong style="font-size: 1.1em; color: #0284c7;">' + town.name + '</strong><br/>' +
            '<span style="font-size: 0.9em; color: #64748b;">' + town.county + ', ' + town.country + '</span><br/>' +
            '<a href="/formby-commons-map/town/' + encodeURIComponent(town.name) + '" style="color: #0d9488; text-decoration: none; font-weight: bold; font-size: 0.95em;">' +
            'Explore ' + town.name + ' &rarr;' +
            '</a>' +
            '</div>';
          marker.bindPopup(popupHtml);
        }
      });
    }
  }, [towns]);

  return (
    <div className="space-y-6">
      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg border border-border">
        <div ref={mapContainerRef} className="h-full w-full z-0" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center p-8 pointer-events-none">
          <h2 className="text-3xl font-headline font-bold text-white text-center drop-shadow-lg">Discover Actions In Formby</h2>
        </div>
      </div>

      {towns.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No town available to display yet. Admin will add Formby to Firestore soon!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {towns.map((town) => (
            <Card key={town.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="p-4 flex-grow">
                <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  {town.name}
                </CardTitle>
                <CardDescription>{town.county}, {town.country}</CardDescription>
              </CardHeader>
              <CardFooter className="p-4 mt-auto">
                <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
                  <a href={'/formby-commons-map/town/' + encodeURIComponent(town.name)} className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Explore {town.name} ({town.locationCount || 0} Actions)
                  </a>
                </Button>
                </CardFooter>
              </Card>
          ))}
        </div>
      )}
    </div>
  );
}