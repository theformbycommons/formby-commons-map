import SuggestLocationForm from '@/components/location/SuggestLocationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { getTowns } from '@/lib/data'; 
// Removed: import type { Town } from '@/lib/types'; // No longer strictly needed here due to explicit mapping

export default async function SuggestLocationPage() {
  // Fetch the full town data
  const allTownsData = await getTowns();

  // Explicitly map to a new array of simple objects with only string id and name
  const townsForForm: Array<{ id: string; name: string }> = allTownsData.map(town => ({
    id: String(town.id), // Ensure id is a string
    name: String(town.name), // Ensure name is a string
  }));

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
          <SuggestLocationForm towns={townsForForm} /> {/* Pass the explicitly plain towns data */}
        </CardContent>
      </Card>
    </div>
  );
}
