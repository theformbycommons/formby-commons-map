import type { Location } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Tag, Star, Eye } from 'lucide-react';

interface LocationCardProps {
  location: Location;
}

function getCategoryIcon(category: string) {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('park') || lowerCategory.includes('nature')) return <MapPin className="w-4 h-4 text-green-500" />;
  if (lowerCategory.includes('cafe') || lowerCategory.includes('coffee')) return <MapPin className="w-4 h-4 text-yellow-600" />;
  if (lowerCategory.includes('landmark') || lowerCategory.includes('historical')) return <MapPin className="w-4 h-4 text-blue-500" />;
  if (lowerCategory.includes('shop')) return <MapPin className="w-4 h-4 text-purple-500" />;
  if (lowerCategory.includes('restaurant') || lowerCategory.includes('pub')) return <MapPin className="w-4 h-4 text-orange-500" />;
  return <MapPin className="w-4 h-4 text-gray-500" />;
}


export default function LocationCard({ location }: LocationCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative w-full h-48">
          <Image
            src={location.imageUrl || `https://placehold.co/400x250.png`}
            alt={`Image of ${location.name}`}
            layout="fill"
            objectFit="cover"
            data-ai-hint={`${location.category} building`}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-lg mb-1 text-primary">{location.name}</CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {getCategoryIcon(location.category)}
          <span>{location.category}</span>
          {location.rating && (
            <>
              <span className="mx-1">|</span>
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span>{location.rating.toFixed(1)}</span>
            </>
          )}
        </div>
        <CardDescription className="text-sm line-clamp-3">{location.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
          <Link href={`/location/${location.id}`} className="flex items-center gap-2">
             <Eye className="w-4 h-4" /> View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
