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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/Spinner';
import { submitSuggestion, type SuggestionFormState } from '@/lib/actions';
import { locationCategories } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import