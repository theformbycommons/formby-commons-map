
'use client';

import type { Town } from '@/lib/types';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Eye } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect } from 'react';

interface UKMapProps {
  towns: Town[];
}

export default function UKMap({ towns }: UKMapProps) {
  useEffect(() => {
    // This check is still good for client-side only execution of Leaflet specific setup
    if (typeof window !== 'undefined') {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: iconRetinaUrl.src,
        iconUrl: iconUrl.src,
        shadowUrl: shadowUrl.src,
      });
    }
  }, []);

  const ukCenter: L.LatLngExpression = [54.5, -2.5]; // Approx center of UK
  const ukZoom = 6;

  // The component will now only render on the client due to next/dynamic ssr:false
  return (
    <div className="space-y-6">
      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg border border-border">
        <MapContainer center={ukCenter} zoom={ukZoom} scrollWheelZoom={false} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {towns.map((town) => (
            <Marker key={town.id} position={[town.coordinates.lat, town.coordinates.lng]}>
              <Popup>
                <div className="font-semibold">{town.name}</div>
                <div>{town.county}, {town.country}</div>
                <Link href={`/town/${encodeURIComponent(town.name.toLowerCase())}`} className="text-accent hover:underline">
                  Explore {town.name} &rarr;
                </Link>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center p-8 pointer-events-none">
          <h2 className="text-3xl font-headline font-bold text-white text-center drop-shadow-lg">Discover Places Across the UK</h2>
        </div>
      </div>

      {towns.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No towns available to display yet. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {towns.map((town) => (
            <Card key={town.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="relative w-full h-48 rounded-t-md overflow-hidden mb-4">
                  <Image
                    src={town.imageUrl || `https://placehold.co/400x250.png`}
                    alt={`Image of ${town.name}`}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={`${town.name} landmark`}
                  />
                </div>
                <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  {town.name}
                </CardTitle>
                <CardDescription>{town.county}, {town.country}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{town.description}</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
                  <Link href={`/town/${encodeURIComponent(town.name.toLowerCase())}`} className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Explore {town.name} ({town.locationCount} Locations)
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
