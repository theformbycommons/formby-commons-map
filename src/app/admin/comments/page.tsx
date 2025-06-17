
'use client';

import { useEffect, useState } from 'react';
import type { SuggestedComment } from '@/lib/types';
import { getPendingComments } from '@/lib/admin-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, MessageSquareWarning, Loader2, Edit3, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<SuggestedComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Pending Comments - Local Glow Admin';
    async function fetchData() {
      setIsLoading(true);
      try {
        const fetchedComments = await getPendingComments();
        setComments(fetchedComments);
      } catch (error) {
        console.error("Failed to fetch pending comments:", error);
        toast({ title: "Error", description: "Failed to load pending comments.", variant: "destructive" });
      }
      setIsLoading(false);
    }
    fetchData();
  }, [toast]);

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const firestoreConsoleBaseUrl = projectId
    ? `https://console.firebase.google.com/project/${projectId}/firestore/data/suggestedComments`
    : null;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 text-center py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Loading pending comments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageSquareWarning className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-3xl text-primary">Manage Pending Comments</CardTitle>
          </div>
          <CardDescription>
            Review new comments submitted by users. Use the "Manage in Firebase Console" link to approve or reject them.
            Approved comments will appear on the relevant location pages.
          </CardDescription>
          {!firestoreConsoleBaseUrl && (
            <Alert variant="destructive" className="mt-4">
              <Edit3 className="h-4 w-4" />
              <AlertDescription>
                The <strong>NEXT_PUBLIC_FIREBASE_PROJECT_ID</strong> environment variable is not set.
                Please set it in your .env file to enable direct links to the Firebase Console for manual edits/rejections.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground">No pending comments found.</p>
              <p className="text-sm text-muted-foreground mt-2">Looks like everything is up to date!</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {comments.map((comment) => (
                <li key={comment.id}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow bg-card/50">
                    <CardHeader className="pb-2 pt-3 px-4 border-b">
                       <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold text-primary">{comment.userName}</h4>
                            <p className="text-xs text-muted-foreground">
                                Commenting on: <Link href={`/location/${comment.locationId}`} target="_blank" className="hover:underline text-accent">{comment.locationName}</Link>
                            </p>
                        </div>
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">
                            Pending
                        </Badge>
                       </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.commentText}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>
                          Submitted: {comment.submittedAt ? format(parseISO(comment.submittedAt), 'dd MMM yyyy, HH:mm') : 'N/A'}
                        </p>
                        {comment.suggesterUid && <p>Anonymous User ID: <code className="text-xs bg-muted px-1 rounded">{comment.suggesterUid}</code></p>}
                      </div>
                       <div className="pt-2">
                        {firestoreConsoleBaseUrl && comment.id ? (
                            <Button asChild variant="outline" size="sm">
                              <Link href={`${firestoreConsoleBaseUrl}/${comment.id}`} target="_blank" rel="noopener noreferrer">
                                <Edit3 className="mr-2 h-4 w-4" /> Manage in Firebase Console
                              </Link>
                            </Button>
                          ) : (
                             <Button variant="outline" size="sm" disabled>
                                <Edit3 className="mr-2 h-4 w-4" /> Manage in Firebase Console (disabled)
                              </Button>
                          )}
                       </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter className="text-center border-t pt-6">
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
