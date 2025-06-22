
'use client';

import type { Location } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, CalendarDays } from 'lucide-react';
import VoteControl from './VoteControl';
import { format, parseISO } from 'date-fns';

interface LocationDetailsDisplayProps {
  location: Location;
}

export default function LocationDetailsDisplay({ location }: LocationDetailsDisplayProps) {

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'do MMMM yyyy');
    } catch (e) {
      console.error("Failed to format date:", e);
      return 'Invalid Date';
    }
  };

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

        <Card className="bg-secondary/50 p-4 border-primary/10">
            <h3 className="font-headline text-lg text-primary mb-3 flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Timeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-secondary-foreground">Submitted On</p>
                <p>{formatDate(location.createdAt)}</p>
              </div>
              {location.approvedAt && (
                <div className="space-y-1">
                  <p className="font-medium text-secondary-foreground">Approved On</p>
                  <p>{formatDate(location.approvedAt)}</p>
                </div>
              )}
            </div>
        </Card>

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
