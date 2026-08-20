'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { ListChecks, LogOut, Home as HomeIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Admin Dashboard - The Formby Commons';
  }, []);

  const handleLogout = async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/admin/login');
    } catch (err: any) {
      toast({ title: 'Logout Error', description: err.message, variant: 'destructive' });
    }
  };

  // Client-side auth guard: ensure only signed-in users see the dashboard.
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setIsAuthenticated(!!user);
      setAuthLoading(false);
      if (!user) {
        router.push('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (authLoading) {
    return <div className="max-w-2xl mx-auto text-center py-10">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return null; // router will redirect to login
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <HomeIcon className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-3xl text-primary">Admin Dashboard</CardTitle>
          <CardDescription>Select a task to manage The Formby Commons content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Button asChild variant="outline" className="w-full justify-start text-lg py-6 border-primary/50 hover:bg-primary/10 hover:border-primary">
            <Link href="/admin/suggestions">
              <ListChecks className="mr-3 h-5 w-5 text-primary" />
              Manage Location Suggestions
            </Link>
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t">
           <Button asChild variant="ghost" className="text-muted-foreground hover:text-accent">
            <Link href="/">
              Back to Main Site
            </Link>
          </Button>
          <Button onClick={handleLogout} variant="destructive" className="mt-4 sm:mt-0">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
