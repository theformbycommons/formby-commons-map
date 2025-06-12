
'use client';

import type { Location, LocationComment } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, MapPin, Tag, UserCircle, MessageSquare, CalendarDays, Copy, Send, CheckCircle, XCircle, Info, Loader2, Expand } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useActionState } from 'react';
import { useForm, Controller, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addCommentToLocation, type AddCommentFormState } from '@/lib/actions';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';

interface LocationDetailsDisplayProps {
  location: Location;
}

function getCategoryIcon(category: string) {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('park') || lowerCategory.includes('nature')) return <Tag className="w-5 h-5 text-green-600" />;
  if (lowerCategory.includes('cafe') || lowerCategory.includes('coffee')) return <Tag className="w-5 h-5 text-yellow-700" />;
  if (lowerCategory.includes('landmark') || lowerCategory.includes('historical')) return <Tag className="w-5 h-5 text-blue-600" />;
  return <Tag className="w-5 h-5 text-gray-600" />;
}

const CommentFormSchema = z.object({
  userName: z.string().min(2, "Your name must be at least 2 characters.").max(50, "Name must be 50 characters or less."),
  commentText: z.string().min(3, "Comment must be at least 3 characters.").max(500, "Comment must be 500 characters or less."),
});
type CommentFormData = z.infer<typeof CommentFormSchema>;

const initialCommentFormState: AddCommentFormState = { message: '', type: 'info' };


function CommentForm({ locationId }: { locationId: string }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [actionState, formAction, isPending] = useActionState(addCommentToLocation, initialCommentFormState);

  const { register, handleSubmit, control, formState: { errors }, reset, setError } = useForm<CommentFormData>({
    resolver: zodResolver(CommentFormSchema),
    defaultValues: {
      userName: '',
      commentText: '',
    }
  });

  useEffect(() => {
    if (actionState?.message) {
      console.log('[Client] Action State Updated:', JSON.stringify(actionState, null, 2));

      toast({
        title: actionState.type === 'success' ? 'Success!' : actionState.type === 'error' ? 'Error' : 'Info',
        description: actionState.message,
        variant: actionState.type === 'error' ? 'destructive' : 'default',
      });
      if (actionState.type === 'success') {
        reset();
      } else if (actionState.type === 'error' && actionState.errors) {
        console.log('[Client] Server validation errors received:', JSON.stringify(actionState.errors, null, 2));
        Object.entries(actionState.errors).forEach(([fieldName, fieldErrors]) => {
          if (fieldErrors && fieldErrors.length > 0) {
             if (fieldName === 'userName' || fieldName === 'commentText') {
                setError(fieldName as FieldPath<CommentFormData>, {
                type: 'server',
                message: fieldErrors.join(', '),
              });
            } else {
              console.warn(`[Client] Server validation error for unmapped field '${fieldName}': ${fieldErrors.join(', ')}`);
            }
          }
        });
      }
    }
  }, [actionState, toast, reset, setError]);

  const processCommentSubmit = (data: CommentFormData) => {
    console.log('[Client] processCommentSubmit called with data:', data);
     if (authLoading) {
      console.log('[Client] Auth is loading, returning early.');
      toast({ title: "Authenticating", description: "Please wait, checking user status.", variant: "default" });
      return;
    }

    if (!locationId || typeof locationId !== 'string' || locationId.trim() === '') {
      console.error('[Client] Invalid or missing locationId in CommentForm:', locationId);
      toast({
        title: 'Client Error',
        description: 'Cannot submit comment: Location ID is missing or invalid.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('locationId', locationId);
    formData.append('userName', data.userName);
    formData.append('commentText', data.commentText);
    if (user && user.isAnonymous && user.uid) {
      formData.append('suggesterUid', user.uid);
    }

    console.log('[Client] Submitting comment. FormData prepared. Keys:', Array.from(formData.keys()));
    console.log('[Client] FormData locationId:', formData.get('locationId'));
    console.log('[Client] FormData userName:', formData.get('userName'));
    console.log('[Client] FormData commentText:', formData.get('commentText'));
    console.log('[Client] FormData suggesterUid:', formData.get('suggesterUid'));

    formAction(formData);
  };

  return (
    <Card className="mt-8 shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Leave a Comment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(processCommentSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="userName" className="font-medium">Your Name</Label>
            <Input
              id="userName"
              {...register('userName')}
              className="mt-1"
              aria-invalid={errors.userName ? "true" : "false"}
              disabled={isPending || authLoading}
            />
            {errors.userName && <p className="text-sm text-destructive mt-1">{errors.userName.message}</p>}
          </div>
          <div>
            <Label htmlFor="commentText" className="font-medium">Your Comment</Label>
            <Textarea
              id="commentText"
              {...register('commentText')}
              rows={4}
              className="mt-1"
              aria-invalid={errors.commentText ? "true" : "false"}
              disabled={isPending || authLoading}
            />
            {errors.commentText && <p className="text-sm text-destructive mt-1">{errors.commentText.message}</p>}
          </div>

          {actionState?.message && !actionState.errors && (
             <Alert variant={actionState.type === 'error' ? 'destructive' : 'default'} className={
               actionState.type === 'success' ? 'bg-green-50 border-green-300 text-green-700' :
               actionState.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' : ''
             }>
              {actionState.type === 'success' && <CheckCircle className="h-5 w-5" />}
              {actionState.type === 'error' && <XCircle className="h-5 w-5" />}
              {actionState.type === 'info' && <Info className="h-5 w-5" />}
              <AlertTitle className="font-semibold ml-1">
                {actionState.type === 'success' ? 'Success!' : actionState.type === 'error' ? 'Error' : 'Notification'}
              </AlertTitle>
              <AlertDescription className="ml-1">{actionState.message}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isPending || authLoading}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isPending ? 'Submitting...' : 'Submit Comment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


export default function LocationDetailsDisplay({ location }: LocationDetailsDisplayProps) {
  const { toast } = useToast();

  const handleCopyCoordinates = async () => {
    const coordinatesText = `${location.coordinates.lat.toFixed(3)}, ${location.coordinates.lng.toFixed(3)}`;
    try {
      if (!navigator.clipboard) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Clipboard API not available in this browser.",
        });
        return;
      }
      await navigator.clipboard.writeText(coordinatesText);
      toast({
        title: "Copied!",
        description: "Coordinates copied to clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy coordinates: ', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy coordinates.",
      });
    }
  };

  const sortedComments = location.comments && location.comments.length > 0
    ? [...location.comments].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    : [];


  return (
    <Dialog>
      <Card className="overflow-hidden shadow-xl">
        <CardHeader className="p-0 relative">
          <DialogTrigger asChild>
            <div className="relative w-full h-64 md:h-80 bg-muted group cursor-pointer">
              <Image
                src={location.imageUrl || `https://placehold.co/800x400.png`}
                alt={`Image of ${location.name}`}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={`${location.category} interior exterior`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent group-hover:from-black/10 group-hover:via-black/5 transition-colors" />
              <div className="absolute top-2 right-2 p-2 bg-black/30 rounded-full group-hover:bg-accent transition-colors">
                <Expand className="h-5 w-5 text-white" />
              </div>
            </div>
          </DialogTrigger>
          <div className="absolute bottom-0 left-0 p-6 w-full pointer-events-none">
              <CardTitle className="font-headline text-3xl md:text-4xl text-white drop-shadow-lg">{location.name}</CardTitle>
              <CardDescription className="text-lg text-primary-foreground/90 drop-shadow-sm">{location.townName}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="space-y-4 text-sm">

            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md">
              {getCategoryIcon(location.category)}
              <span className="font-medium text-secondary-foreground">Category:</span>
              <span>{location.category}</span>
            </div>


            <div className="p-3 bg-secondary/50 rounded-md space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="font-medium text-secondary-foreground">Coordinates:</span>
                <span>{location.coordinates.lat.toFixed(3)}, {location.coordinates.lng.toFixed(3)}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCoordinates}
                  className="ml-auto h-7 w-7"
                  aria-label="Copy Coordinates"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pl-7">
                These values can be copy and pasted into e.g. Google Maps.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-headline text-xl text-primary mb-2">Description</h3>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{location.description}</p>
            <p className="text-sm text-muted-foreground mt-3">
              Have a photo that you feel captures the essence of this place even better? We encourage you to{' '}
              <Link href="/suggest-location" className="text-accent hover:underline">
                share your perspective by suggesting it
              </Link>! Your unique view helps enrich our collective Local Glow.
            </p>
          </div>

          {sortedComments && sortedComments.length > 0 && (
            <div>
              <h3 className="font-headline text-xl text-primary mb-3 flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                User Comments ({sortedComments.length})
              </h3>
              <div className="space-y-4">
                {sortedComments.map((comment) => (
                  <Card key={comment.id} className="bg-background/70 shadow-sm">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium">
                          <UserCircle className="w-4 h-4" />
                          {comment.user}
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {format(parseISO(comment.date), 'dd MMM yyyy, HH:mm')}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 pt-1 px-4">
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <CommentForm locationId={location.id} />

        </CardContent>

        <CardFooter className="p-6 border-t">
          <Button asChild variant="outline">
            <Link href={`/town/${encodeURIComponent(location.townName)}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {location.townName}
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      <DialogContent className="max-w-3xl p-2 sm:p-4 md:p-6">
        <div className="relative w-full aspect-video bg-muted">
           {location.imageUrl && (
            <Image
                src={location.imageUrl}
                alt={`Full view of ${location.name}`}
                layout="fill"
                objectFit="contain" // Ensures the whole image is visible
                data-ai-hint={`${location.category} full view`}
            />
           )}
           {!location.imageUrl && (
             <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No image available for this location.</p>
             </div>
           )}
        </div>
        <DialogClose asChild>
            <Button variant="outline" className="mt-4 w-full sm:w-auto">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
    
