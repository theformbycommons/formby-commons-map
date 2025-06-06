
import { getSuggestedLocations } from '@/lib/admin-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Edit3, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import type { NewLocationSuggestion } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const metadata = {
  title: 'Pending Suggestions - Local Glow Admin',
  description: 'Review and manage new location suggestions.',
};

function StatusBadge({ status }: { status: NewLocationSuggestion['status'] }) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    case 'approved':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

export default async function AdminSuggestionsPage() {
  const suggestions = await getSuggestedLocations();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  const firestoreConsoleBaseUrl = projectId
    ? `https://console.firebase.google.com/project/${projectId}/firestore/data/suggestedLocations`
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">Manage Location Suggestions</CardTitle>
          <CardDescription>
            Review new submissions. 
            {firestoreConsoleBaseUrl ? 
              " To edit, approve, or reject, click the 'Manage in Firebase Console' button for a specific suggestion."
              : " Firebase Project ID not configured, so direct links to the console are disabled."
            }
          </CardDescription>
          {!firestoreConsoleBaseUrl && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The <strong>NEXT_PUBLIC_FIREBASE_PROJECT_ID</strong> environment variable is not set. 
                Please set it in your .env file to enable direct links to manage suggestions in the Firebase Console.
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
                          <StatusBadge status={suggestion.status} />
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
                           {/* PostcodeOutcode removed from display here */}
                        </div>
                        
                        <div className="pt-2">
                          {firestoreConsoleBaseUrl ? (
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
