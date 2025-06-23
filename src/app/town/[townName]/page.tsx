
import { getTownByName, getLocationsByTownId } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import ClientTownMap from '@/components/map/ClientTownMap'; 
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <CardTitle className="font-headline text-4xl text-primary">{town.name}</CardTitle>
                    <CardDescription className="text-lg">{town.county}, {town.country}</CardDescription>
                </div>
                <Button asChild variant="outline" className="mt-4 md:mt-0 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                  <Link href="/suggest-location">
                    <PlusCircle className="mr-2 h-4 w-4" /> Suggest an Action
                  </Link>
                </Button>
            </div>
        </CardHeader>
        <CardFooter>
            <Button asChild variant="link" className="px-0 text-accent">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Towns
                </Link>
            </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Actions in {town.name}</CardTitle>
          <CardDescription>Discover proposed Actions submitted for this community.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientTownMap locations={locations} town={town} />
        </CardContent>
      </Card>
    </div>
  );
}
