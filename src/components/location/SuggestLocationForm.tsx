'use client';

import { useState, useEffect, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldPath } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/Spinner';
import { submitSuggestion, type SuggestionFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Info, MapPin as MapPinIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import type { Town } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isWithinFormby } from '@/lib/map-config';

const LocationPickerMap = dynamic(() => import('@/components/map/LocationPickerMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-md bg-muted" />,
});

const SuggestionFormClientSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long.").max(100, "Name must be 100 characters or less."),
  description: z.string().max(1000, "Description must be 1000 characters or less.").optional().refine((val) => {
    if (val === undefined) return true;
    const t = String(val).trim();
    return t.length === 0 || t.length >= 10;
  }, { message: 'Description must be at least 10 characters if provided.' }),
  townName: z.string().min(2, "Town name is required.").max(50, "Town name must be 50 characters or less."),
  suggesterName: z.string().min(2, "Your name must be at least 2 characters long.").max(50, "Your name must be 50 characters or less."),
  category: z.string().optional(),
  issueStatus: z.enum(['reported','improved']).optional(),
  latitude: z.number({ required_error: "Please select a location on the map." }),
  longitude: z.number({ required_error: "Please select a location on the map." }),
}).refine((data) => isWithinFormby(data.latitude, data.longitude), {
  message: "Selected location must fall within the Formby boundary.",
  path: ["latitude"],
});

type SuggestionFormData = z.infer<typeof SuggestionFormClientSchema>;

const initialState: SuggestionFormState = {
  message: '',
  type: 'info',
};

interface SuggestLocationFormProps {
  towns: Pick<Town, 'id' | 'name'>[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  const isDisabled = pending;
  let buttonText = 'Submit Suggestion';
  if (pending) {
    buttonText = 'Saving Suggestion...';
  }

  return (
    <Button type="submit" disabled={isDisabled} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
      {pending && <Spinner size={20} className="mr-2" />}
      {buttonText}
    </Button>
  );
}

export default function SuggestLocationForm({ towns }: SuggestLocationFormProps) {
  const [state, formAction] = useFormState(submitSuggestion, initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [selectedMapCoords, setSelectedMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const { user, loading: authLoading } = useAuth();

  const { register, handleSubmit, control, formState: { errors }, reset, setValue, trigger, setError, watch } = useForm<SuggestionFormData>({
    resolver: zodResolver(SuggestionFormClientSchema),
    defaultValues: {
      name: '',
      description: '',
      townName: '',
      suggesterName: '',
      category: undefined,
      issueStatus: 'reported',
    }
  });

  const townNameValue = watch('townName');

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.type === 'success' ? 'Success!' : state.type === 'error' ? 'Error' : 'Info',
        description: state.message,
        variant: state.type === 'error' ? 'destructive' : 'default',
      });
      if (state.type === 'success') {
        reset();
        setSelectedMapCoords(null);
        setValue('latitude', undefined as any, { shouldValidate: false });
        setValue('longitude', undefined as any, { shouldValidate: false });
      } else if (state.type === 'error' && state.errors) {
        Object.entries(state.errors).forEach(([fieldName, fieldErrors]) => {
          if (fieldErrors && fieldErrors.length > 0) {
            if (Object.keys(SuggestionFormClientSchema.shape).includes(fieldName)) {
               setError(fieldName as FieldPath<SuggestionFormData>, {
                type: 'server',
                message: fieldErrors.join(', '),
              });
            }
          }
        });
      }
    }
  }, [state, toast, reset, setError, setValue]);

  const handleCoordinatesChange = (coords: { lat: number; lng: number } | null) => {
    setSelectedMapCoords(coords);
    if (coords && isWithinFormby(coords.lat, coords.lng)) {
      setValue('latitude', coords.lat, { shouldValidate: true });
      setValue('longitude', coords.lng, { shouldValidate: true });
    } else {
      setValue('latitude', undefined as any, { shouldValidate: true });
      setValue('longitude', undefined as any, { shouldValidate: true });
    }
  };

  const handleTownSelection = (selectedTownName: string) => {
    setValue('townName', selectedTownName === "__NEW__" ? "" : selectedTownName, { shouldValidate: true });
  };

  const processSubmit = async (data: SuggestionFormData) => {
    if (authLoading) {
      toast({ title: "Authenticating", description: "Please wait, checking user status.", variant: "default" });
      return;
    }

    const formDataForServerAction = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formDataForServerAction.append(key, String(value));
      }
    });

    if (user && user.isAnonymous && user.uid) {
      formDataForServerAction.append('suggesterUid', user.uid);
    } else {
      try {
        const cookieName = 'anonId';
        const getCookie = (name: string) => document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1];
        let anonId = getCookie(cookieName);
        if (!anonId && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          anonId = crypto.randomUUID();
          const maxAgeDays = 7;
          document.cookie = `${cookieName}=${anonId}; path=/; max-age=${60*60*24*maxAgeDays}`;
        }
        if (anonId) {
          formDataForServerAction.append('suggesterAnonId', anonId);
        }
      } catch (e) {
        console.warn('Could not create anonId cookie', e);
      }
    }

    startTransition(() => {
      formAction(formDataForServerAction);
    });
  };

  const selectValue = towns.find(t => t.name === townNameValue)
    ? townNameValue
    : (townNameValue === "" ? "" : "__NEW__");

  return (
    <form
      onSubmit={handleSubmit(processSubmit)}
      className="space-y-6"
    >
      <div>
        <Label htmlFor="name" className="font-medium">Action Name</Label>
        <Input id="name" {...register('name')} className="mt-1" aria-invalid={errors.name ? "true" : "false"} />
        <p className="text-xs text-muted-foreground mt-1">Suggest a name that best describes your entry.</p>
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="category" className="font-medium">Issue Category</Label>
        <Select
          onValueChange={(val) => setValue('category', val, { shouldValidate: true })}
          value={watch('category') || ''}
        >
          <SelectTrigger id="category" className="w-full mt-1">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Overgrown Pavement">Overgrown Pavement</SelectItem>
            <SelectItem value="Roundabout Improvement Needed">Roundabout Improvement Needed</SelectItem>
            <SelectItem value="Unsafe Crossing">Unsafe Crossing</SelectItem>
            <SelectItem value="Missing Drop Kerb">Missing Drop Kerb</SelectItem>
            <SelectItem value="Cars Parked On Pavement">Cars Parked On Pavement</SelectItem>
            <SelectItem value="Speeding">Speeding</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">Choose the category that best fits the issue.</p>
      </div>

      <div>
        <Label htmlFor="issueStatus" className="font-medium">Issue Status</Label>
        <Select
          onValueChange={(val) => setValue('issueStatus', val as 'reported' | 'improved', { shouldValidate: true })}
          value={watch('issueStatus') || 'reported'}
        >
          <SelectTrigger id="issueStatus" className="w-full mt-1">
            <SelectValue placeholder="Reported / Improved" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reported">Reported</SelectItem>
            <SelectItem value="improved">Improved</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">Mark whether this issue is still reported or already improved.</p>
      </div>

      <div>
        <Label htmlFor="description" className="font-medium">Description</Label>
        <Textarea id="description" {...register('description')} rows={4} className="mt-1" aria-invalid={errors.description ? "true" : "false"} />
        <p className="text-xs text-muted-foreground mt-1">Optional short description of the issue.</p>
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="townSelect" className="font-medium">Town</Label>
        <Select
          onValueChange={handleTownSelection}
          value={selectValue}
        >
          <SelectTrigger id="townSelect" className="w-full">
            <SelectValue placeholder="Select an existing town or enter new one below" />
          </SelectTrigger>
          <SelectContent>
            {towns.map(town => (
              <SelectItem key={town.id} value={town.name}>{town.name}</SelectItem>
            ))}
            <SelectItem value="__NEW__">-- Or enter a new town name below --</SelectItem>
          </SelectContent>
        </Select>

        <Input
            id="townName"
            {...register('townName')}
            className="mt-1"
            placeholder="Enter new town name here if not listed above"
            aria-invalid={errors.townName ? "true" : "false"}
        />
        <p className="text-xs text-muted-foreground mt-1">Select a town from the list or enter a new one.</p>
        {errors.townName && <p className="text-sm text-destructive mt-1">{errors.townName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="locationMap" className="font-medium flex items-center gap-1">
            <MapPinIcon className="h-5 w-5 text-primary" /> Precise Location (Required)
        </Label>
        <p className="text-xs text-muted-foreground mt-1">Click on the map to place a pin within Formby.</p>
        <LocationPickerMap value={selectedMapCoords} onValueChange={handleCoordinatesChange} />
        <input type="hidden" {...register('latitude')} />
        <input type="hidden" {...register('longitude')} />
        {(errors.latitude || errors.longitude) && (
            <p className="text-sm text-destructive mt-1">
                {errors.latitude?.message || errors.longitude?.message || "Please select a valid location inside Formby."}
            </p>
        )}
      </div>

      <div>
        <Label htmlFor="suggesterName" className="font-medium">Your Name/Pseudonym</Label>
        <Input id="suggesterName" {...register('suggesterName')} className="mt-1" aria-invalid={errors.suggesterName ? "true" : "false"} />
        <p className="text-xs text-muted-foreground mt-1">For internal use only.</p>
        {errors.suggesterName && <p className="text-sm text-destructive mt-1">{errors.suggesterName.message}</p>}
      </div>

      {state?.message && !state.errors && (
         <Alert variant={state.type === 'error' ? 'destructive' : 'default'} className={
           state.type === 'success' ? 'bg-green-50 border-green-300 text-green-700' :
           state.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' : ''
         }>
          {state.type === 'success' && <CheckCircle className="h-5 w-5" />}
          {state.type === 'error' && <XCircle className="h-5 w-5" />}
          {state.type === 'info' && <Info className="h-5 w-5" />}
          <AlertTitle className="font-semibold ml-1">
            {state.type === 'success' ? 'Success!' : state.type === 'error' ? 'Error' : 'Notification'}
          </AlertTitle>
          <AlertDescription className="ml-1">{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}
