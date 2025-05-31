
'use client';

import dynamic from 'next/dynamic';
import type { Location, Town } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ActualTownMap = dynamic(() => import('@/components/map/TownMap'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg border border-border bg-muted animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-center p-6">
          <h2 className="text-2xl font-headline font-bold text-white text-center">Loading Map...</h2>
        </div>
      </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader className="p-0">
                <Skeleton className="relative w-full h-48" />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <Skeleton className="h-5 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter className="p-4 border-t">
                <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  ),
});

interface ClientTownMapProps {
  locations: Location[];
  town: Town;
}

export default function ClientTownMap({ locations, town }: ClientTownMapProps) {
  return <ActualTownMap locations={locations} town={town} />;
}
