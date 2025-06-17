
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { ListChecks, MessageSquareWarning, LogOut, Home as HomeIcon } from 'lucide-react'; // Renamed Home to HomeIcon
import { useEffect } from 'react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Admin Dashboard - Local Glow';
  }, []);

  const handleLogout = async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
      
      const response = await fetch('/api/auth/session-logout', { method: 'POST' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Logout failed');
      }
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/admin/login');
    } catch (err: any) {
      toast({ title: 'Logout Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <HomeIcon className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-3xl text-primary">Admin Dashboard</CardTitle>
          <CardDescription>Select a task to manage Local Glow content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Button asChild variant="outline" className="w-full justify-start text-lg py-6 border-primary/50 hover:bg-primary/10 hover:border-primary">
            <Link href="/admin/suggestions">
              <ListChecks className="mr-3 h-5 w-5 text-primary" />
              Manage Location Suggestions
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full justify-start text-lg py-6 border-primary/50 hover:bg-primary/10 hover:border-primary">
            <Link href="/admin/comments">
              <MessageSquareWarning className="mr-3 h-5 w-5 text-primary" />
              Manage Pending Comments
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
