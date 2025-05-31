
'use client';

import dynamic from 'next/dynamic';
import type { Town } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ActualUKMap = dynamic(() => import('@/components/map/UKMap'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg border border-border bg-muted animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center p-8">
          <h2 className="text-3xl font-headline font-bold text-white text-center">Loading Map...</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader>
              <Skeleton className="relative w-full h-48 rounded-t-md overflow-hidden mb-4" />
              <Skeleton className="h-6 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex-grow">
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  ),
});

interface ClientUKMapProps {
  towns: Town[];
}

export default function ClientUKMap({ towns }: ClientUKMapProps) {
  return <ActualUKMap towns={towns} />;
}
