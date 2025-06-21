
import type { Location } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Eye } from 'lucide-react';

interface LocationCardProps {
  location: Location;
}

export default function LocationCard({ location }: LocationCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-lg mb-1 text-primary">{location.name}</CardTitle>
        <CardDescription className="text-sm line-clamp-3 mt-2">{location.description}</CardDescription>
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
