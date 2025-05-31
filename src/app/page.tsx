import UKMap from '@/components/map/UKMap';
import { getTowns } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function HomePage() {
  const towns = await getTowns();

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-card rounded-lg shadow-md">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Welcome to Local Lens UK</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore vibrant towns and hidden gems across the United Kingdom. Discover unique locations shared by locals and travelers alike.
        </p>
      </section>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Towns with Local Lenses</CardTitle>
          <CardDescription>Click on a town to explore its unique locations and attractions.</CardDescription>
        </CardHeader>
        <CardContent>
          <UKMap towns={towns} />
        </CardContent>
      </Card>
    </div>
  );
}
