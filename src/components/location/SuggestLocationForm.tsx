
'use client';

import { useActionState, startTransition, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, type FieldPath } from 'react-hook-form';
import { useFormStatus } from 'react-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/Spinner';
import { submitSuggestion, type SuggestionFormState } from '@/lib/actions'; // Updated FormState type if needed
import { locationCategories, mockTowns } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Info, MapPin as MapPinIcon, File as FileIcon } from 'lucide-react';
import { resizeImage } from '@/lib/imageUtils';
import { storage } from '@/lib/firebase'; // Client-side storage
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

const LocationPickerMap = dynamic(() => import('@/components/map/LocationPickerMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-md bg-muted" />,
});

const SuggestionFormClientSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long.").max(100, "Name must be 100 characters or less."),
  description: z.string().min(10, "Description must be at least 10 characters long.").max(1000, "Description must be 1000 characters or less."),
  townName: z.string().min(2, "Town name is required.").max(50, "Town name must be 50 characters or less."),
  category: z.string().min(1, "Please select a category."),
  suggesterName: z.string().min(2, "Your name must be at least 2 characters long.").max(50, "Your name must be 50 characters or less."),
  // suggesterComment: z.string().max(500, "Comment must be 500 characters or less.").optional(), // Removed
  pictureFile: z.any().optional()
    .refine(files => !files || files.length === 0 || files[0].size <= 5 * 1024 * 1024, `Max original file size is 5MB.`)
    .refine(files => !files || files.length === 0 || ['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type),
      'Only .jpg, .png, .webp formats are supported for original upload.'
    ),
  latitude: z.number({ required_error: "Please select a location on the map." })
            .min(-90, "Invalid latitude. Please select a location on the map.")
            .max(90, "Invalid latitude. Please select a location on the map."),
  longitude: z.number({ required_error: "Please select a location on the map." })
             .min(-180, "Invalid longitude. Please select a location on the map.")
             .max(180, "Invalid longitude. Please select a location on the map."),
});

type SuggestionFormData = z.infer<typeof SuggestionFormClientSchema>;

const initialState: SuggestionFormState = {
  message: '',
  type: 'info',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  const [isResizing, setIsResizing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    const handleImageResizeStart = () => setIsResizing(true);
    const handleImageResizeEnd = () => setIsResizing(false);
    const handleImageUploadStart = () => setIsUploadingImage(true);
    const handleImageUploadEnd = () => setIsUploadingImage(false);

    window.addEventListener('image-resize-start' as any, handleImageResizeStart);
    window.addEventListener('image-resize-end' as any, handleImageResizeEnd);
    window.addEventListener('image-upload-start' as any, handleImageUploadStart);
    window.addEventListener('image-upload-end' as any, handleImageUploadEnd);

    return () => {
      window.removeEventListener('image-resize-start' as any, handleImageResizeStart);
      window.removeEventListener('image-resize-end' as any, handleImageResizeEnd);
      window.removeEventListener('image-upload-start' as any, handleImageUploadStart);
      window.removeEventListener('image-upload-end' as any, handleImageUploadEnd);
    };
  }, []);

  const isDisabled = pending || isResizing || isUploadingImage;
  let buttonText = 'Submit Suggestion';
  if (isResizing) {
    buttonText = 'Resizing Image...';
  } else if (isUploadingImage) {
    buttonText = 'Uploading Image...';
  } else if (pending) {
    buttonText = 'Saving Suggestion...';
  }

  return (
    <Button type="submit" disabled={isDisabled} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
      {(pending || isResizing || isUploadingImage) && <Spinner size={20} className="mr-2" />}
      {buttonText}
    </Button>
  );
}

export default function SuggestLocationForm() {
  const [state, formAction] = useActionState(submitSuggestion, initialState);
  const { toast } = useToast();
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [selectedMapCoords, setSelectedMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { user, loading: authLoading } = useAuth(); 

  const { register, handleSubmit, control, formState: { errors }, reset, setValue, trigger, setError } = useForm<SuggestionFormData>({
    resolver: zodResolver(SuggestionFormClientSchema),
    defaultValues: {
      name: '',
      description: '',
      townName: '',
      category: '',
      suggesterName: '',
      // suggesterComment: '', // Removed
      pictureFile: undefined,
    }
  });

  const { onChange: rhfPictureFileOnChange, ...restPictureFileRegister } = register('pictureFile');

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.type === 'success' ? 'Success!' : state.type === 'error' ? 'Error' : 'Info',
        description: state.message,
        variant: state.type === 'error' ? 'destructive' : 'default',
      });
      if (state.type === 'success') {
        reset();
        setCurrentFile(null);
        setSelectedMapCoords(null); 
        setValue('latitude', undefined as any, { shouldValidate: false });
        setValue('longitude', undefined as any, { shouldValidate: false });
        const fileInput = document.getElementById('pictureFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    rhfPictureFileOnChange(event); 

    if (event.target.files && event.target.files.length > 0) {
      setCurrentFile(event.target.files[0]);
    } else {
      setCurrentFile(null);
    }
  };

  const handleCoordinatesChange = (coords: { lat: number; lng: number } | null) => {
    setSelectedMapCoords(coords);
    if (coords) {
      setValue('latitude', coords.lat, { shouldValidate: true });
      setValue('longitude', coords.lng, { shouldValidate: true });
    } else {
      setValue('latitude', undefined as any, { shouldValidate: true }); 
      setValue('longitude', undefined as any, { shouldValidate: true }); 
    }
  };

  const processSubmit = async (data: SuggestionFormData) => {
    if (authLoading) {
      toast({ title: "Authenticating", description: "Please wait, checking user status.", variant: "default" });
      return;
    }

    let imageUrl: string | undefined = undefined;
    let uploadedImageSize: number | undefined = undefined;
    let fileToUpload: File | null = null;

    const actualFileToProcess = data.pictureFile?.[0] || currentFile;

    if (actualFileToProcess) {
      window.dispatchEvent(new CustomEvent('image-resize-start'));
      try {
        const resized = await resizeImage(actualFileToProcess, 800, 600, 200, 'image/webp');
        fileToUpload = (resized.size / 1024 > 250 && resized.type === 'image/webp')
          ? await resizeImage(actualFileToProcess, 800, 600, 200, 'image/jpeg')
          : resized;
      } catch (error) {
        console.error("Error resizing image:", error);
        toast({ title: "Image Processing Error", description: "Could not resize image. Please try a different image or try again.", variant: "destructive" });
        window.dispatchEvent(new CustomEvent('image-resize-end'));
        return;
      }
      window.dispatchEvent(new CustomEvent('image-resize-end'));

      if (fileToUpload) {
        window.dispatchEvent(new CustomEvent('image-upload-start'));
        try {
          const safeFileName = fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '');
          const uniqueFileName = `${Date.now()}-${safeFileName}`;
          const imagePath = `suggested_location_images/${uniqueFileName}`;
          const imageStorageRef = storageRef(storage, imagePath);

          const snapshot = await uploadBytes(imageStorageRef, fileToUpload);
          imageUrl = await getDownloadURL(snapshot.ref);
          uploadedImageSize = snapshot.metadata.size;
        } catch (uploadError: any) {
          console.error("Error uploading image:", uploadError);
          let errorDesc = "Could not upload image. Please try again.";
          if (uploadError.code === 'storage/unauthorized') {
            errorDesc = "Upload failed: You are not authorized. Please check storage rules.";
          } else if (uploadError.code === 'storage/canceled') {
            errorDesc = "Upload canceled.";
          }
          toast({ title: "Image Upload Error", description: errorDesc, variant: "destructive" });
          window.dispatchEvent(new CustomEvent('image-upload-end'));
          return;
        }
        window.dispatchEvent(new CustomEvent('image-upload-end'));
      }
    }

    const formDataForServerAction = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      // if (key === 'suggesterComment') { // Removed
      //   if (value !== undefined && value !== null && String(value).trim() !== '') {
      //     formDataForServerAction.append(key, String(value));
      //   }
      //   return; 
      // }

      if (key !== 'pictureFile' && value !== undefined && value !== null) {
        if (String(value).trim() !== '' || typeof value === 'number' ) {
             formDataForServerAction.append(key, String(value));
        } else if ( (key === 'suggesterName' || key === 'name' || key === 'description' || key === 'townName' || key === 'category') && String(value).trim() === '' ) {
             formDataForServerAction.append(key, "");
        }
      }
    });

    if (user && user.isAnonymous && user.uid) {
      formDataForServerAction.append('suggesterUid', user.uid);
    }

    if (imageUrl) {
      formDataForServerAction.append('imageUrl', imageUrl);
    }
    if (uploadedImageSize !== undefined) {
      formDataForServerAction.append('uploadedImageSize', String(uploadedImageSize));
    }

    startTransition(() => {
      formAction(formDataForServerAction);
    });
  };

  return (
    <form
      onSubmit={handleSubmit(processSubmit)}
      className="space-y-6"
    >
      <div>
        <Label htmlFor="name" className="font-medium">Location Name</Label>
        <Input id="name" {...register('name')} className="mt-1" aria-invalid={errors.name ? "true" : "false"} />
        <p className="text-xs text-muted-foreground mt-1">Suggest a name that best describes your entry.</p>
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="description" className="font-medium">Description</Label>
        <Textarea id="description" {...register('description')} rows={4} className="mt-1" aria-invalid={errors.description ? "true" : "false"} />
        <p className="text-xs text-muted-foreground mt-1">Tell us about this place. What makes it special? Please be specific; your unique observations allow us all to experience the charm and warmth of your town through your eyes.</p>
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
      </div>

      <div>
          <Label htmlFor="townName" className="font-medium">Town Name</Label>
          <Input id="townName" {...register('townName')} className="mt-1" placeholder="e.g., Formby" list="town-suggestions" aria-invalid={errors.townName ? "true" : "false"} />
          <datalist id="town-suggestions">
            {mockTowns.map(town => <option key={town.id} value={town.name} />)}
          </datalist>
          {errors.townName && <p className="text-sm text-destructive mt-1">{errors.townName.message}</p>}
      </div>
      
      <div>
        <Label htmlFor="category" className="font-medium">Category</Label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""} aria-invalid={errors.category ? "true" : "false"}>
              <SelectTrigger id="category" className="mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {locationCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="locationMap" className="font-medium flex items-center gap-1">
            <MapPinIcon className="h-5 w-5 text-primary" /> Precise Location (Required)
        </Label>
        <p className="text-xs text-muted-foreground mt-1">Click on the map to place a pin for the exact location. You can drag the pin too.</p>
        <LocationPickerMap value={selectedMapCoords} onValueChange={handleCoordinatesChange} />
        <input type="hidden" {...register('latitude')} />
        <input type="hidden" {...register('longitude')} />
        {(errors.latitude || errors.longitude) && (
            <p className="text-sm text-destructive mt-1">
                {errors.latitude?.message || errors.longitude?.message || "Please select a valid location on the map."}
            </p>
        )}
      </div>

      <div>
        <Label htmlFor="pictureFile" className="font-medium">Picture (Optional, max 5MB original)</Label>
        <Input
          id="pictureFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          {...restPictureFileRegister} 
          onChange={handleFileChange}   
          className="mt-1 file:text-sm file:font-medium file:text-primary file:bg-primary-foreground/10 hover:file:bg-primary-foreground/20"
        />
        <p className="text-xs text-muted-foreground mt-1">Max 5MB (will be resized to ~200KB). JPG, PNG, or WEBP.</p>
        {currentFile && (
          <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2 bg-secondary/30 p-2 rounded-md border border-input">
            <FileIcon className="h-4 w-4 text-secondary-foreground" />
            <span>Selected: {currentFile.name} ({(currentFile.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
        {errors.pictureFile && <p className="text-sm text-destructive mt-1">{errors.pictureFile.message as string}</p>}
      </div>

      <div>
        <Label htmlFor="suggesterName" className="font-medium">Your Name</Label>
        <Input id="suggesterName" {...register('suggesterName')} className="mt-1" aria-invalid={errors.suggesterName ? "true" : "false"} />
        <p className="text-xs text-muted-foreground mt-1">How you'd like to be credited (e.g., first name, nickname, initials, or a pseudonym).</p>
        {errors.suggesterName && <p className="text-sm text-destructive mt-1">{errors.suggesterName.message}</p>}
      </div>

      {/* Removed suggesterComment field
      <div>
        <Label htmlFor="suggesterComment" className="font-medium">Your Comments/Notes (Optional)</Label>
        <Textarea id="suggesterComment" {...register('suggesterComment')} rows={3} className="mt-1" aria-invalid={errors.suggesterComment ? "true" : "false"} />
        <p className="text-xs text-muted-foreground mt-1">Any additional details or why you're suggesting this place.</p>
        {errors.suggesterComment && <p className="text-sm text-destructive mt-1">{errors.suggesterComment.message}</p>}
      </div>
      */}

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
