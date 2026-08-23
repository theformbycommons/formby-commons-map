'use client';

import React, { useState } from 'react';
import { CATEGORIES } from '@/lib/categories';
import { submitNewAction } from '@/lib/firestore-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoordinates?: { lat: number; lng: number } | null;
  onSuccess?: () => void;
}

export default function AddActionModal({ isOpen, onClose, initialCoordinates, onSuccess }: AddActionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('speeding');
  const [suggesterName, setSuggesterName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const defaultCoords = initialCoordinates || { lat: 53.559, lng: -3.069 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await submitNewAction({
        name,
        description,
        category,
        coordinates: defaultCoords,
        suggesterName,
      });

      setIsSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to submit action:', err);
      alert('Error submitting your suggestion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setDescription('');
    setCategory('speeding');
    setSuggesterName('');
    setIsSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Suggest a Highway Safety Action
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Submit a concern in Formby. Your report will be reviewed before appearing on the public map.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="font-semibold text-slate-900">Report Submitted</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Thank you! Your suggestion for Formby has been sent for review and will be posted shortly.
            </p>
            <Button onClick={handleReset} className="mt-4 bg-slate-900 hover:bg-slate-800 text-xs">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Action Title / Title</label>
              <Input
                required
                placeholder="e.g. Speeding past school entrance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CATEGORIES).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <Textarea
                placeholder="Provide location details or specific concerns..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs h-20 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Your Name (Optional)</label>
              <Input
                placeholder="Anonymous or your name"
                value={suggesterName}
                onChange={(e) => setSuggesterName(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleReset} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-xs">
                {isSubmitting ? 'Submitting...' : 'Submit Action'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
