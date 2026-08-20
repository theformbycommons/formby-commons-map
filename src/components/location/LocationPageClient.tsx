"use client";

import React, { useEffect, useState } from 'react';
import type { Location } from '@/lib/types';
import { getLocationById } from '@/lib/data';
import LocationDetailsDisplay from '@/components/location/LocationDetailsDisplay';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { bp } from '@/lib/basePath';
import { ArrowLeft } from 'lucide-react';

interface Props {
  locationId: string;
}

export default function LocationPageClient({ locationId }: Props) {
  const [location, setLocation] = useState<Location | null | undefined>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getLocationById(locationId)
      .then(loc => {
        if (mounted) setLocation(loc ?? null);
      })
      .catch(err => {
        console.error('Error fetching location on client:', err);
        if (mounted) setLocation(undefined);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [locationId]);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!location) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-destructive mb-4">Location Not Found</h1>
        <p className="text-muted-foreground mb-6">Sorry, we couldn't find details for this location.</p>
        <Button asChild>
          <Link href={bp('/')}>
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
