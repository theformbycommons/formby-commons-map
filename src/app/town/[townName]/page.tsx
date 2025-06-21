
import { getTownByName, getLocationsByTownId } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, PlusCircle } from 'lucide-react';
// Removed direct Image import, will be handled by TownBannerImage
import ClientTownMap from '@/components/map/ClientTownMap'; 
import type { Town } from '@/lib/types'; 
import TownBannerImage from '@/components/town/TownBannerImage'; // Import the new component
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface TownPageProps {
  params: {
    townName: string;
  };
}

export default async function TownPage({ params }: TownPageProps) {
  const townName = decodeURIComponent(params.townName);
  const town = await getTownByName(townName);

  if (!town) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-destructive mb-4">Town Not Found</h1>
        <p className="text-muted-foreground mb-6">Sorry, we couldn't find information for "{townName}".</p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  const locations = await getLocationsByTownId(town.id);
  const storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  return (
    <div className="space-y-8">
      <section className="relative bg-card rounded-lg shadow-md overflow-hidden p-6 md:p-8 min-h-[250px] md:min-h-[300px]">
        {/* Use Suspense for the client component loading the image */}
        <Suspense fallback={<Skeleton className="absolute inset-0 w-full h-full" />}>
          <TownBannerImage townName={town.name} storageBucketName={storageBucketName} />
        </Suspense>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary mb-1 drop-shadow-lg">{town.name}</h1>
              <p className="text-lg text-muted-foreground drop-shadow-md">{town.county}, {town.country}</p>
            </div>
            <Button asChild variant="outline" className="mt-4 md:mt-0 border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-background/70 hover:bg-accent/90 backdrop-blur-sm">
              <Link href="/suggest-location">
                <PlusCircle className="mr-2 h-4 w-4" /> Suggest an Action
              </Link>
            </Button>
          </div>
          
          <Button asChild variant="link" className="px-0 text-accent bg-background/70 hover:bg-accent/10 rounded-md p-2 backdrop-blur-sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Towns
            </Link>
          </Button>
        </div>
      </section>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Locations in {town.name}</CardTitle>
          <CardDescription>Discover interesting places submitted by our community.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientTownMap locations={locations} town={town} />
        </CardContent>
      </Card>
    </div>
  );
}
