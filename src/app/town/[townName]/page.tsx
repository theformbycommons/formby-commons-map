
import ClientTownPage from '@/components/town/TownPageClient';

// Return a static set of town names for which static HTML will be generated.
export async function generateStaticParams() {
  return [
    { townName: 'formby' },
  ];
}

interface TownPageProps {
  params: {
    townName: string;
  };
}

export default function TownPage({ params }: TownPageProps) {
  // Render a client-side component to fetch town data in the browser.
  return <ClientTownPage townName={params.townName} />;
}
