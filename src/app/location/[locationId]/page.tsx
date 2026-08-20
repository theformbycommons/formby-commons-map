
import LocationPageClient from '@/components/location/LocationPageClient';

interface LocationPageProps {
  params: {
    locationId: string;
  };
}

export default function LocationPage({ params }: LocationPageProps) {
  // Render a client-side component that fetches location data in the browser.
  return <LocationPageClient locationId={params.locationId} />;
}
