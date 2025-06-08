
'use client';

import type { Location } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Tag, UserCircle, MessageSquare, CalendarDays, Copy } from 'lucide-react';
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

  return (
    <Card className="overflow-hidden shadow-xl">
      <CardHeader className="p-0 relative">
        <div className="relative w-full h-64 md:h-80 bg-muted">
          <Image
            src={location.imageUrl || `https://placehold.co/800x400.png`}
            alt={`Image of ${location.name}`}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-500 hover:scale-105"
            data-ai-hint={`${location.category} interior exterior`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 p-6 w-full">
            <CardTitle className="font-headline text-3xl md:text-4xl text-white drop-shadow-lg">{location.name}</CardTitle>
            <CardDescription className="text-lg text-primary-foreground/90 drop-shadow-sm">{location.townName}</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4 text-sm">
          
          <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md">
            {getCategoryIcon(location.category)}
            <span className="font-medium text-secondary-foreground">Category:</span>
            <span>{location.category}</span>
          </div>
          
          
          <div className="p-3 bg-secondary/50 rounded-md space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              <span className="font-medium text-secondary-foreground">Coordinates:</span>
              <span>{location.coordinates.lat.toFixed(3)}, {location.coordinates.lng.toFixed(3)}</span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCopyCoordinates} 
                className="ml-auto h-7 w-7"
                aria-label="Copy Coordinates"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
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

        {/* Removed suggesterComment display section
        {location.suggesterComment && (
          <div>
            <h3 className="font-headline text-lg text-primary mb-2">Note from {location.submittedBy || 'Suggester'}</h3>
            <blockquote className="border-l-4 border-accent pl-4 py-2 bg-secondary/30 rounded-r-md">
              <p className="text-foreground/80 italic">{location.suggesterComment}</p>
            </blockquote>
          </div>
        )}
        */}

        {location.comments && location.comments.length > 0 && (
          <div>
            <h3 className="font-headline text-xl text-primary mb-3 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              User Comments ({location.comments.length})
            </h3>
            <div className="space-y-4">
              {location.comments.map((comment) => (
                <Card key={comment.id} className="bg-background/70 shadow-sm">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium">
                        <UserCircle className="w-4 h-4" />
                        {comment.user}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {format(parseISO(comment.date), 'dd MMM yyyy')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 pt-1 px-4">
                    <p className="text-sm text-foreground/90">{comment.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
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
