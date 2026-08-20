"use client";

import React, { useEffect, useState } from 'react';
import SuggestLocationForm from '@/components/location/SuggestLocationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { getTowns } from '@/lib/data';

export default function SuggestLocationPageClient() {
  const [townsForForm, setTownsForForm] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getTowns()
      .then(allTownsData => {
        const mapped = allTownsData.map(town => ({ id: String(town.id), name: String(town.name) }));
        if (mounted) setTownsForForm(mapped);
      })
      .catch(err => {
        console.error('Error fetching towns for suggest form:', err);
        if (mounted) setTownsForForm([]);
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <Lightbulb className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-3xl text-primary">Suggest a New Action</CardTitle>
          <CardDescription className="text-md">Share your proposed Actions. Your suggestion will be reviewed before appearing on the site.</CardDescription>
        </CardHeader>
        <CardContent>
          <SuggestLocationForm towns={townsForForm} />
        </CardContent>
      </Card>
    </div>
  );
}
