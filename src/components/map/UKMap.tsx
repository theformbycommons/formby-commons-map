
'use client';

import type { Town } from '@/lib/types';
import L, { type Map as LeafletMapClass } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Eye } from 'lucide-react';
// Removed direct Image import, will be handled by TownPreviewImage
import React, { useEffect, useRef } from 'react';
import TownPreviewImage from '@/components/town/TownPreviewImage'; // Import the new component

interface UKMapProps {
  towns: Town[];
}

export default function UKMap({ towns }: UKMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapClass | null>(null);
  const storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

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

      const ukCenter: L.LatLngExpression = [54.5, -2.5];
      const ukZoom = 6;

      mapRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: false,
      }).setView(ukCenter, ukZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      towns.forEach((town) => {
        if (town.coordinates) { // Ensure coordinates exist
          const marker = L.marker([town.coordinates.lat, town.coordinates.lng]).addTo(mapRef.current!);
          const popupContent = `
            <div style="font-family: 'PT Sans', sans-serif; padding: 4px;">
              <strong style="font-size: 1.1em; color: hsl(var(--primary));">${town.name}</strong><br/>
              <span style="font-size: 0.9em; color: hsl(var(--muted-foreground));">${town.county}, ${town.country}</span><br/>
              <a href="/town/${encodeURIComponent(town.name)}" style="color: hsl(var(--accent)); text-decoration: none; font-weight: bold; font-size: 0.95em;">
                Explore ${town.name} &rarr;
              </a>
            </div>
          `;
          marker.bindPopup(popupContent);
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [towns]);

  return (
    <div className="space-y-6">
      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg border border-border">
        <div ref={mapContainerRef} className="h-full w-full z-0" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center p-8 pointer-events-none">
          <h2 className="text-3xl font-headline font-bold text-white text-center drop-shadow-lg">Discover Actions Across the UK</h2>
        </div>
      </div>

      {towns.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No towns available to display yet. Add some to Firestore!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {towns.map((town) => (
            <Card key={town.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="p-0"> {/* Changed padding to p-0 to let image fill */}
                <div className="relative w-full h-48 rounded-t-md overflow-hidden">
                  <TownPreviewImage 
                    townName={town.name} 
                    storageBucketName={storageBucketName} 
                  />
                </div>
              </CardHeader>
              {/* Rest of the card content remains below the image container in CardHeader */}
              <div className="p-4"> {/* Add padding back for content below header */}
                <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  {town.name}
                </CardTitle>
                <CardDescription>{town.county}, {town.country}</CardDescription>
              </div>
              <CardContent className="p-4 pt-0 flex-grow"> {/* Adjusted padding */}
                <p className="text-sm text-muted-foreground line-clamp-3">{town.description}</p>
              </CardContent>
              <CardFooter className="p-4"> {/* Ensure padding for footer */}
                <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
                  <a href={`/town/${encodeURIComponent(town.name)}`} className="flex items-center gap-2">
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
