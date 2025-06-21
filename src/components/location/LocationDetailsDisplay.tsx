'use client';

import type { Location, LocationComment } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Tag, Copy } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';


interface LocationDetailsDisplayProps {
  location: Location;
}

function getCategoryIcon(category: string) {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('park') || lowerCategory.includes('nature')) return <Tag className="w-5 h-5 text-green-600" />;
  if (lowerCategory.includes('cafe') || lowerCategory.includes('coffee')) return <Tag className="w-5 h-5 text-yellow-700" />;
  if (lowerCategory.includes('landmark') || lowerCategory.includes('historical')) return <Tag className="w-5 h-5 text-blue-600" />;
  return <Tag className="w-5 h-5 text-gray-600" />;
}


export default function LocationDetailsDisplay({ location }: LocationDetailsDisplayProps) {
  const { toast } = useToast();

  /* Comments feature is disabled for now */
  /*
  const handleCopyCoordinates = async () => {
    const coordinatesText = `${location.coordinates.lat.toFixed(3)}, ${location.coordinates.lng.toFixed(3)}`;
    try {
      if (!navigator.clipboard) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Clipboard API not available in this browser.",
        });
        return;
      }
      await navigator.clipboard.writeText(coordinatesText);
      toast({
        title: "Copied!",
        description: "Coordinates copied to clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy coordinates: ', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy coordinates.",
      });
    }
  };

  const sortedComments = location.comments && location.comments.length > 0
    ? [...location.comments].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    : [];
*/


  return (
    <Card className="overflow-hidden shadow-xl">
      <CardContent className="p-6 space-y-6">
        <div className="pb-4 border-b border-border">
          <CardTitle className="font-headline text-3xl md:text-4xl text-primary">{location.name}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">{location.townName}</CardDescription>
        </div>

        <div className="space-y-4 text-sm">

          <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md">
            {getCategoryIcon(location.category)}
            <span className="font-medium text-secondary-foreground">Category:</span>
            <span>{location.category}</span>
          </div>


          <div className="p-3 bg-secondary/50 rounded-md space-y-1">
            <div className="flex items-center gap-2">
              {/* Using MapPin directly as getCategoryIcon is specific to tags */}
              {/* <MapPin className="w-5 h-5 text-accent" /> Remove if you prefer the Tag icon above */}

              {/* Re-added MapPin as it seems appropriate for coordinates */}

                <MapPin className="w-5 h-5 text-accent" />
                <span className="font-medium text-secondary-foreground">Coordinates:</span>
                <span>{location.coordinates.lat.toFixed(3)}, {location.coordinates.lng.toFixed(3)}</span>
                {/* <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCoordinates}
                  className="ml-auto h-7 w-7"
                  aria-label="Copy Coordinates"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button> */}
            </div>
            <p className="text-xs text-muted-foreground pl-7">
              These values can be copy and pasted into e.g. Google Maps.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-headline text-xl text-primary mb-2">Description</h3>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{location.description}</p>
            <p className="text-sm text-muted-foreground mt-3">
              Please vote on this Action.
            </p>
          </div>

        {/* Comment display disabled
        {sortedComments && sortedComments.length > 0 && (
          <div>
            <h3 className="font-headline text-xl text-primary mb-3 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              User Comments ({sortedComments.length})
            </h3>
            <div className="space-y-4">
              {sortedComments.map((comment) => (
                <Card key={comment.id} className="bg-background/70 shadow-sm">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium">
                        <UserCircle className="w-4 h-4" />
                        {comment.user}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {format(parseISO(comment.date), 'dd MMM yyyy, HH:mm')}
                      </div>
                    </CardHeader>
                  <CardContent className="pb-3 pt-1 px-4">
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
*/}

        {/* Comment form disabled for now */}
        {/*
        <CommentForm locationId={location.id} />
*/}

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