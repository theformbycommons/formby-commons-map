
'use client'; 

import { getSuggestedLocations } from '@/lib/admin-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
// Removed: import { useRouter } from 'next/navigation'; // No longer needed here
import { ArrowLeft, Edit3, CheckCircle, XCircle, Clock, AlertTriangle, Send, Loader2, Home, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import type { NewLocationSuggestion } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  approveSuggestion, type ApproveSuggestionFormState,
  deleteSuggestion, type DeleteSuggestionFormState 
} from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useActionState, startTransition } from 'react';
// Removed: import { auth } from '@/lib/firebase'; // Logout handled by dashboard now
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


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

const initialApproveState: ApproveSuggestionFormState = { message: '', type: 'info' };
const initialDeleteState: DeleteSuggestionFormState = { message: '', type: 'info' };

function ApproveButton({ suggestionId, currentStatus }: { suggestionId: string, currentStatus: NewLocationSuggestion['status'] }) {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(approveSuggestion, initialApproveState);

  useEffect(() => {
    if (state.message && state.suggestionId === suggestionId) {
      toast({
        title: state.type === 'success' ? 'Success!' : state.type === 'error' ? 'Error' : 'Info',
        description: state.message,
        variant: state.type === 'error' ? 'destructive' : state.type === 'info' ? 'default' : 'default',
      });
    }
  }, [state, toast, suggestionId]);


  if (currentStatus === 'rejected') { // No approve button for rejected items
    return null; 
  }

  return (
    <form action={formAction}>
        <input type="hidden" name="suggestionId" value={suggestionId} />
        <Button 
            type="submit"
            variant="outline" 
            size="sm" 
            className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
            disabled={isPending}
            aria-disabled={isPending}
        >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        {currentStatus === 'pending' ? 'Approve & Publish' : 'Complete Publishing'}
        </Button>
    </form>
  );
}

function DeleteSuggestionButton({ suggestionId, suggestionName, imageUrl }: { suggestionId: string, suggestionName: string, imageUrl?: string | null }) {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(deleteSuggestion, initialDeleteState);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => {
    if (state.message && state.suggestionId === suggestionId) {
      toast({
        title: state.type === 'success' ? 'Success!' : state.type === 'error' ? 'Error' : 'Info',
        description: state.message,
        variant: state.type === 'error' ? 'destructive' : state.type === 'info' ? 'default' : 'default',
      });
      if (state.type === 'success' || state.type === 'info') { 
        setIsAlertOpen(false);
      }
    }
  }, [state, toast, suggestionId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); 
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isPending} aria-disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={handleSubmit}> 
          <input type="hidden" name="suggestionId" value={suggestionId} />
          {imageUrl && <input type="hidden" name="imageUrl" value={imageUrl} />}
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the suggestion for <strong className="text-foreground">{suggestionName}</strong>.
              {imageUrl && " The associated image will also be deleted."} This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<NewLocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  // Removed: const router = useRouter(); // No longer used here

  const [actionState] = useActionState(() => Promise.resolve({ message: '', type: 'info' }), { message: '', type: 'info' });


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
  }, [toast, actionState]); 


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
            {/* Logout button removed, now on dashboard */}
          </div>
          <CardDescription>
            Review new submissions. Use 'Approve & Publish' to make them live. 
            Use 'Manage in Firebase Console' for direct edits or to reject. Use 'Delete' to remove a suggestion permanently.
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
                            fill
                            style={{objectFit: "cover"}}
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
                          {suggestion.status !== 'rejected' && suggestion.id && (
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
                           {suggestion.id && (
                            <DeleteSuggestionButton 
                                suggestionId={suggestion.id} 
                                suggestionName={suggestion.name}
                                imageUrl={suggestion.imageUrl} 
                            />
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
              <Link href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
              </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

const ImageLayoutFix = () => <Image src="https://placehold.co/100x100.png" alt="fix" layout="fill" objectFit="cover" />;
