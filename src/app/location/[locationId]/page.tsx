
import LocationPageClient from '@/components/location/LocationPageClient';

// Provide a minimal static params list so `next export` can generate pages.
export async function generateStaticParams() {
  return [{ locationId: '1' }];
}

interface LocationPageProps {
  params: {
    locationId: string;
  };
}

export default function LocationPage({ params }: LocationPageProps) {
  // Render a client-side component that fetches location data in the browser.
  return <LocationPageClient locationId={params.locationId} />;
}
