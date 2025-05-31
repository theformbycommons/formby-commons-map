import type { Location } from '@/lib/types';
import LocationCard from '@/components/location/LocationCard';
import Image from 'next/image';

interface TownMapProps {
  locations: Location[];
  townName: string;
}

export default function TownMap({ locations, townName }: TownMapProps) {
  return (
    <div className="space-y-6">
      <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg border border-border">
        <Image
          src={`https://placehold.co/1000x500.png`}
          alt={`Map of ${townName}`}
          layout="fill"
          objectFit="cover"
          data-ai-hint="town map"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-center p-6">
          <h2 className="text-2xl font-headline font-bold text-white text-center">Explore {townName}</h2>
        </div>
      </div>

      {locations.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No locations found for {townName}. Be the first to <a href="/suggest-location" className="text-accent hover:underline">suggest one</a>!</p>
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
