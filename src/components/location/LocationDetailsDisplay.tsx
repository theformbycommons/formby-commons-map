
'use client';

import type { Location } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin } from 'lucide-react';
import VoteControl from './VoteControl';


interface LocationDetailsDisplayProps {
  location: Location;
}

export default function LocationDetailsDisplay({ location }: LocationDetailsDisplayProps) {

  return (
    <Card className="overflow-hidden shadow-xl">
      <CardContent className="p-6 space-y-6">
        <div className="pb-4 border-b border-border">
          <CardTitle className="font-headline text-3xl md:text-4xl text-primary">{location.name}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">{location.townName}</CardDescription>
        </div>

        <div className="space-y-4 text-sm">
          <div className="p-3 bg-secondary/50 rounded-md space-y-1">
            <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="font-medium text-secondary-foreground">Coordinates:</span>
                <span>{location.coordinates.lat.toFixed(3)}, {location.coordinates.lng.toFixed(3)}</span>
            </div>
            <p className="text-xs text-muted-foreground pl-7">
              These values can be copy and pasted into e.g. Google Maps.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-headline text-xl text-primary mb-2">Description</h3>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{location.description}</p>
        </div>
        
        <VoteControl locationId={location.id} initialVotes={location.votes} />

      </CardContent>

      <CardFooter className="p-6 border-t">
          <Button asChild variant="outline">
            <Link href={`/town/${encodeURIComponent(location.townName)}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {location.townName}
            </Link>
          </Button>
        </CardFooter>
    </Card>
  );
}
