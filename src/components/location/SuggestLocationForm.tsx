'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/Spinner';
import { submitSuggestion, type FormState } from '@/lib/actions';
import { locationCategories, mockTowns } from '@/lib/data'; // Using mockTowns for town suggestions
import { useEffect }
from 'react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const SuggestionFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long.").max(100, "Name must be 100 characters or less."),
  description: z.string().min(10, "Description must be at least 10 characters long.").max(1000, "Description must be 1000 characters or less."),
  townName: z.string().min(2, "Town name is required.").max(50, "Town name must be 50 characters or less."),
  category: z.string().min(1, "Please select a category."),
  suggesterName: z.string().min(2, "Your name must be at least 2 characters long.").max(50, "Your name must be 50 characters or less."),
  suggesterComment: z.string().max(500, "Comment must be 500 characters or less.").optional(),
  pictureFile: z.any().optional() // Use z.any() to avoid FileList error on SSR
    .refine(files => !files || files.length === 0 || files[0].size <= 5 * 1024 * 1024, `Max file size is 5MB.`)
    .refine(files => !files || files.length === 0 || ['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type),
      'Only .jpg, .png, .webp formats are supported.'
    ),
});

type SuggestionFormData = z.infer<typeof SuggestionFormSchema>;

const initialState: FormState = {
  message: '',
  type: 'info',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
      {pending ? <Spinner size={20} className="mr-2" /> : null}
      {pending ? 'Submitting...' : 'Submit Suggestion'}
    </Button>
  );
}

export default function SuggestLocationForm() {
  const [state, formAction] = useFormState(submitSuggestion, initialState);
  const { toast } = useToast();

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<SuggestionFormData>({
    resolver: zodResolver(SuggestionFormSchema),
    defaultValues: {
      name: '',
      description: '',
      townName: '',
      category: '',
      suggesterName: '',
      suggesterComment: '',
      pictureFile: undefined,
    }
  });
  
  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.type === 'success' ? 'Success!' : state.type === 'error' ? 'Error' : 'Info',
        description: state.message,
        variant: state.type === 'error' ? 'destructive' : 'default',
      });
      if (state.type === 'success') {
        reset(); // Reset form on successful submission
      }
    }
  }, [state, toast, reset]);


  return (
    <form action={formAction} className="space-y-6">
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              <Select onValueChange={field.onChange} defaultValue={field.value} aria-invalid={errors.category ? "true" : "false"}>
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
      </div>

      <div>
        <Label htmlFor="pictureFile" className="font-medium">Picture (Optional)</Label>
        <Input id="pictureFile" type="file" {...register('pictureFile')} className="mt-1 file:text-sm file:font-medium file:text-primary file:bg-primary-foreground/10 hover:file:bg-primary-foreground/20" />
        <p className="text-xs text-muted-foreground mt-1">Max 5MB. JPG, PNG, or WEBP.</p>
        {errors.pictureFile && <p className="text-sm text-destructive mt-1">{errors.pictureFile.message as string}</p>}
      </div>
      
      <div>
        <Label htmlFor="suggesterName" className="font-medium">Your Name</Label>
        <Input id="suggesterName" {...register('suggesterName')} className="mt-1" aria-invalid={errors.suggesterName ? "true" : "false"} />
        <p className="text-xs text-muted-foreground mt-1">How you'd like to be credited (e.g., first name, nickname, initials, or a pseudonym).</p>
        {errors.suggesterName && <p className="text-sm text-destructive mt-1">{errors.suggesterName.message}</p>}
      </div>

      <div>
        <Label htmlFor="suggesterComment" className="font-medium">Your Comments/Notes (Optional)</Label>
        <Textarea id="suggesterComment" {...register('suggesterComment')} rows={3} className="mt-1" />
        <p className="text-xs text-muted-foreground mt-1">Any additional details or why you're suggesting this place.</p>
        {errors.suggesterComment && <p className="text-sm text-destructive mt-1">{errors.suggesterComment.message}</p>}
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
