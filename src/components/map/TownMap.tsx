
'use client';

import type { Location, Town } from '@/lib/types';
import LocationCard from '@/components/location/LocationCard';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import React, { useEffect } from 'react';

interface TownMapProps {
  locations: Location[];
  town: Town;
}

export default function TownMap({ locations, town }: TownMapProps) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: iconRetinaUrl.src,
      iconUrl: iconUrl.src,
      shadowUrl: shadowUrl.src,
    });
  }, []);

  const townCenter: L.LatLngExpression = [town.coordinates.lat, town.coordinates.lng];
  const townZoom = 13;

  return (
    <div className="space-y-6">
      <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg border border-border">
        <MapContainer center={townCenter} zoom={townZoom} scrollWheelZoom={false} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map((location) => (
            <Marker key={location.id} position={[location.coordinates.lat, location.coordinates.lng]}>
              <Popup>
                <div className="font-semibold">{location.name}</div>
                <div>{location.category}</div>
                <Link href={`/location/${location.id}`} className="text-accent hover:underline">
                  View Details &rarr;
                </Link>
              </Popup>
            </Marker>
          ))}
           <Marker position={townCenter} icon={L.icon({iconUrl: iconUrl.src, iconRetinaUrl: iconRetinaUrl.src, shadowUrl: shadowUrl.src, iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], tooltipAnchor: [16,-28], shadowSize: [41,41]})}>
             <Popup>
               <span className="font-bold">{town.name} Town Center</span>
             </Popup>
           </Marker>
        </MapContainer>
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
