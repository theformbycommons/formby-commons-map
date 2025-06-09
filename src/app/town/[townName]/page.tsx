
import { getTownByName, getLocationsByTownId } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import ClientTownMap from '@/components/map/ClientTownMap'; // Import the new client component
import type { Town } from '@/lib/types'; 

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

  const placeholderImageSrc = `https://placehold.co/800x400/90EE90.png`; // Light green
  const bannerImageSrc = town.imageUrl || placeholderImageSrc;
  const bannerImageAlt = town.imageUrl ? `Banner image for ${town.name}` : `Placeholder light green banner for ${town.name}`;
  const bannerImageAiHint = town.imageUrl ? `${town.name} landscape` : "green background";

  return (
    <div className="space-y-8">
      <section className="relative bg-card rounded-lg shadow-md overflow-hidden p-6 md:p-8">
        <Image
          src={bannerImageSrc}
          alt={bannerImageAlt}
          layout="fill"
          objectFit="cover"
          className="opacity-20 z-0"
          data-ai-hint={bannerImageAiHint}
          priority // Consider adding priority if this image is LCP for the town page
        />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary mb-1">{town.name}</h1>
              <p className="text-lg text-muted-foreground">{town.county}, {town.country}</p>
            </div>
            <Button asChild variant="outline" className="mt-4 md:mt-0 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              <Link href="/suggest-location">
                <PlusCircle className="mr-2 h-4 w-4" /> Suggest a Location
              </Link>
            </Button>
          </div>
          <p className="text-md text-foreground max-w-3xl mb-4">{town.description}</p>
          
          <Button asChild variant="link" className="px-0 text-accent">
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
