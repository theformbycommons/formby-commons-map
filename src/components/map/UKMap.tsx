import type { Town } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Eye } from 'lucide-react';

interface UKMapProps {
  towns: Town[];
}

export default function UKMap({ towns }: UKMapProps) {
  return (
    <div className="space-y-6">
      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg border border-border">
        <Image
          src="https://placehold.co/1200x600.png"
          alt="Map of the UK highlighting featured towns"
          layout="fill"
          objectFit="cover"
          data-ai-hint="UK map"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center p-8">
          <h2 className="text-3xl font-headline font-bold text-white text-center">Discover Places Across the UK</h2>
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
