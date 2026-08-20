"use client";

import React, { useEffect, useState } from 'react';
import { getTowns } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ClientUKMap from '@/components/map/ClientUKMap';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpenText, Compass, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import type { Town } from '@/lib/types';

export default function HomePageClient() {
  const [towns, setTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getTowns()
      .then(t => { if (mounted) setTowns(t); })
      .catch(err => { console.error('Error fetching towns on client:', err); if (mounted) setTowns([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-8">
      <section className="relative text-center pt-4 pb-12 md:pt-6 md:pb-16 bg-card rounded-lg shadow-md overflow-hidden">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/community-80928.firebasestorage.app/o/background-images%2Fformby1.jpg?alt=media"
          alt="Evocative background image of a charming local town scene"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 w-full h-full z-0"
          data-ai-hint="Formby beach woodland"
          priority
        />
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="bg-background/20 p-6 rounded-lg max-w-2xl w-full mx-auto shadow-xl backdrop-blur-sm space-y-4">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2 drop-shadow-md">Welcome to The Formby Commons</h1>
            <p className="text-lg font-bold text-accent mx-auto drop-shadow-sm">
              Act and Support Change in Our Local Communities
            </p>
            <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground mt-8 sm:mt-10">
              <Link href="/about">
                <BookOpenText className="mr-2 h-4 w-4" /> The Idea Behind The Formby Commons
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section>
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Compass className="h-8 w-8 text-primary" />
              <CardTitle className="font-headline text-2xl text-primary">How to Discover & Share The Formby Commons</CardTitle>
            </div>
            <CardDescription>A quick guide to navigating the site and contributing your proposed Actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-foreground/90">
            {/* content omitted for brevity; reuse server markup */}
            <div className="flex items-start gap-3 p-3 rounded-md bg-card border">
              <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <h4 className="font-semibold mb-1 text-primary/90">Find Your Town</h4>
                <p>Tap or click markers on the UK map below to go to a town, or select one from the preview cards that appear underneath it.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-md bg-card border">
              <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <h4 className="font-semibold mb-1 text-primary/90">Find local proposed Actions</h4>
                <p>Within each town, explore unique Actions revealed on the town's interactive map or listed beneath it.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-md bg-card border">
              <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <h4 className="font-semibold mb-1 text-primary/90">Contribute Your Actions</h4>
                <p>Want to propose an Action? Click the "Suggest Action" button (top right, with a <PlusCircle className="inline-block h-4 w-4 text-accent align-text-bottom" /> icon). Fill out the form, and crucially, set the location by clicking on the map within the form – you can zoom using +/- or pinch gestures.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-md bg-card border">
              <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
              <div>
                <h4 className="font-semibold mb-1 text-primary/90">Evaluate individual actions</h4>
                <p>Vote on individual actions by selecting the negative, neutral, or positive symbol.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Towns with The Formby Commons</CardTitle>
          <CardDescription>Click on a town marker to explore its unique Actions, or see town cards below.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientUKMap towns={towns} />
        </CardContent>
      </Card>
    </div>
  );
}
