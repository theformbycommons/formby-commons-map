
import { getTowns } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import ClientUKMap from '@/components/map/ClientUKMap'; // Import the new client component

export default async function HomePage() {
  const towns = await getTowns();

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-card rounded-lg shadow-md">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Welcome to The Local Glow</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Celebrating the Heart and Soul of Our Hometowns
        </p>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-3">
          A vibrant collection of what makes our towns uniquely lovable, seen through the eyes of those who call them home. Discover the everyday magic and cherished corners that define our communities, celebrating their spirit.
        </p>
      </section>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Towns with Local Glow</CardTitle>
          <CardDescription>Click on a town to explore its unique locations.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientUKMap towns={towns} />
        </CardContent>
      </Card>
    </div>
  );
}
