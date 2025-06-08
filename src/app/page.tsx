
import { getTowns } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import ClientUKMap from '@/components/map/ClientUKMap';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpenText } from 'lucide-react';
import Image from 'next/image'; // Added Image import

export default async function HomePage() {
  const towns = await getTowns();

  return (
    <div className="space-y-8">
      <section className="relative text-center py-8 bg-card rounded-lg shadow-md overflow-hidden">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/community-80928.firebasestorage.app/o/background-images%2Fformby1.jpg?alt=media"
          alt="Evocative background image of a charming local town scene"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 w-full h-full z-0 opacity-40"
          data-ai-hint="Formby beach woodland"
          priority // Preload image as it's LCP candidate
        />
        <div className="relative z-10"> {/* Content wrapper to ensure it's above the image */}
          <h1 className="text-4xl font-headline font-bold text-primary mb-2 drop-shadow-sm">Welcome to Local Glow</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto drop-shadow-sm">
            Celebrating the Heart and Soul of Our Hometowns
          </p>
          <p className="text-sm font-semibold text-primary-foreground max-w-xl mx-auto mt-3 mb-6 drop-shadow-sm">
            A vibrant collection of what makes our towns uniquely lovable, seen through the eyes of those who call them home. Discover the everyday magic and cherished corners that define our communities, celebrating their spirit.
          </p>
          <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            <Link href="/about">
              <BookOpenText className="mr-2 h-4 w-4" /> The Idea Behind Local Glow
            </Link>
          </Button>
        </div>
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
