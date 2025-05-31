import { getLocationById } from '@/lib/data';
import LocationDetailsDisplay from '@/components/location/LocationDetailsDisplay';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface LocationPageProps {
  params: {
    locationId: string;
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const location = await getLocationById(params.locationId);

  if (!location) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-destructive mb-4">Location Not Found</h1>
        <p className="text-muted-foreground mb-6">Sorry, we couldn't find details for this location.</p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <LocationDetailsDisplay location={location} />
    </div>
  );
}
