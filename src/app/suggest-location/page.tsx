import SuggestLocationForm from '@/components/location/SuggestLocationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { getTowns } from '@/lib/data'; // Import getTowns
import type { Town } from '@/lib/types'; // Import Town type

export default async function SuggestLocationPage() {
  const towns: Pick<Town, 'id' | 'name'>[] = (await getTowns()).map(town => ({ id: town.id, name: town.name }));

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <Lightbulb className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-3xl text-primary">Suggest a New Location</CardTitle>
          <CardDescription className="text-md">
            Help us grow Local Glow! Share your favorite spots and hidden gems.
            Your suggestion will be reviewed before appearing on the site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SuggestLocationForm towns={towns} /> {/* Pass towns as a prop */}
        </CardContent>
      </Card>
    </div>
  );
}
