
'use client'; // Required for useActionState and event handlers

import { getSuggestedLocations } from '@/lib/admin-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, CheckCircle, XCircle, Clock, AlertTriangle, Send, Loader2, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import type { NewLocationSuggestion } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { approveSuggestion, type ApproveSuggestionFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useActionState, startTransition } from 'react';

// Removed metadata export as this is a Client Component
// export const metadata = {
//   title: 'Pending Suggestions - Local Glow Admin',
//   description: 'Review and manage new location suggestions.',
// };

function StatusBadge({ status, approvedAt }: { status: NewLocationSuggestion['status'], approvedAt?: string }) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    case 'approved':
      let approvedText = "Approved";
      if (approvedAt) {
        try {
            approvedText += ` on ${format(parseISO(approvedAt), 'dd MMM yyyy')}`;
        } catch (e) { /* ignore date parsing error for badge */ }
      }
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />{approvedText}</Badge>;
    case 'rejected':
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

function ApproveButton({ suggestionId, currentStatus }: { suggestionId: string, currentStatus: NewLocationSuggestion['status'] }) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const handleApprove = async () => {
    setIsPending(true);
    const formData = new FormData();
    formData.append('suggestionId', suggestionId);
    
    startTransition(async () => {
        const result = await approveSuggestion(undefined, formData);
        if (result.type === 'success') {
        toast({ title: 'Success!', description: result.message, variant: 'default' });
        } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
        setIsPending(false);
    });
  };

  if (currentStatus !== 'pending') {
    return null; 
  }

  return (
    <Button 
        onClick={handleApprove} 
        variant="outline" 
        size="sm" 
        className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
        disabled={isPending}
    >
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Approve & Publish
    </Button>
  );
}


export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<NewLocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    document.title = 'Pending Suggestions - Local Glow Admin';
  }, []);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const fetchedSuggestions = await getSuggestedLocations();
        setSuggestions(fetchedSuggestions);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        toast({ title: "Error", description: "Failed to load suggestions.", variant: "destructive" });
      }
      setIsLoading(false);
    }
    fetchData();
  }, [toast]); 


  const handleLogout = async () => {
    try {
      // Call client-side signOut first
      if (auth) { // auth is imported from '@/lib/firebase'
        await auth.signOut(); // Firebase client-side signOut
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

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const firestoreConsoleBaseUrl = projectId
    ? `https://console.firebase.google.com/project/${projectId}/firestore/data/suggestedLocations`
    : null;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 text-center py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Loading suggestions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-3xl text-primary">Manage Location Suggestions</CardTitle>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
          <CardDescription>
            Review new submissions. Use 'Approve & Publish' to make them live. 
            Use 'Manage in Firebase Console' for direct edits or to reject.
          </CardDescription>
          {!firestoreConsoleBaseUrl && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The <strong>NEXT_PUBLIC_FIREBASE_PROJECT_ID</strong> environment variable is not set. 
                Please set it in your .env file to enable direct links to the Firebase Console for manual edits/rejections.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {suggestions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending suggestions found.</p>
          ) : (
            <ul className="space-y-6">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-3">
                      {suggestion.imageUrl && (
                        <div className="relative h-48 md:h-full w-full bg-muted">
                          <Image
                            src={suggestion.imageUrl}
                            alt={`Image for ${suggestion.name}`}
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="user submitted photo"
                          />
                        </div>
                      )}
                      <div className={`p-4 space-y-3 ${suggestion.imageUrl ? 'md:col-span-2' : 'md:col-span-3'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-headline text-xl text-primary">{suggestion.name}</h3>
                            <p className="text-sm text-muted-foreground">{suggestion.townName} - {suggestion.category}</p>
                          </div>
                          <StatusBadge status={suggestion.status} approvedAt={suggestion.approvedAt} />
                        </div>
                        
                        <p className="text-sm text-foreground/80 line-clamp-3">{suggestion.description}</p>
                        
                        {suggestion.suggesterComment && (
                           <p className="text-xs italic text-muted-foreground border-l-2 border-accent pl-2 py-1">
                             Comment: "{suggestion.suggesterComment}"
                           </p>
                        )}

                        <div className="text-xs text-muted-foreground space-y-1 pt-2">
                          <p><strong>Suggester:</strong> {suggestion.suggesterName}</p>
                          <p>
                            <strong>Submitted:</strong> {suggestion.submittedAt ? format(parseISO(suggestion.submittedAt), 'dd MMM yyyy, HH:mm') : 'N/A'}
                          </p>
                          {suggestion.publishedLocationId && (
                            <p><strong>Published ID:</strong> <code className="text-xs bg-muted px-1 rounded">{suggestion.publishedLocationId}</code></p>
                          )}
                        </div>
                        
                        <div className="pt-2 flex flex-wrap gap-2 items-center">
                          {suggestion.status === 'pending' && suggestion.id && (
                            <ApproveButton suggestionId={suggestion.id} currentStatus={suggestion.status} />
                          )}
                          {firestoreConsoleBaseUrl && suggestion.id ? (
                            <Button asChild variant="outline" size="sm">
                              <Link href={`${firestoreConsoleBaseUrl}/${suggestion.id}`} target="_blank" rel="noopener noreferrer">
                                <Edit3 className="mr-2 h-4 w-4" /> Manage in Firebase Console
                              </Link>
                            </Button>
                          ) : (
                             <Button variant="outline" size="sm" disabled>
                                <Edit3 className="mr-2 h-4 w-4" /> Manage in Firebase Console (disabled)
                              </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter className="text-center">
            <Button asChild variant="outline" className="mx-auto">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
