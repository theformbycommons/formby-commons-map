
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useFormState } from 'react-dom';
import type { Location } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Meh, Smile, Star, Loader2, BarChart2, Info } from 'lucide-react';
import { castVote, type CastVoteFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type VoteType = 'neutral' | 'positive' | 'fantastic';
type VoteCounts = Record<VoteType, number>;

interface VoteControlProps {
  locationId: string;
  initialVotes?: VoteCounts;
}

const initialFormState: CastVoteFormState = {
  message: '',
  type: 'info',
};

function VoteResults({ votes, userHasVoted }: { votes: VoteCounts, userHasVoted: boolean }) {
  const totalVotes = votes.neutral + votes.positive + votes.fantastic;

  const getPercentage = (count: number) => {
    return totalVotes > 0 ? (count / totalVotes) * 100 : 0;
  };

  const voteOptions: { type: VoteType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'neutral', label: 'Neutral', icon: <Meh className="h-6 w-6 text-yellow-600" />, color: 'bg-yellow-500' },
    { type: 'positive', label: 'Positive', icon: <Smile className="h-6 w-6 text-green-600" />, color: 'bg-green-500' },
    { type: 'fantastic', label: 'Fantastic!', icon: <Star className="h-6 w-6 text-blue-600" />, color: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground">
        {userHasVoted ? "Thank you for your vote! Here are the current results:" : "Here are the current results for this proposal:"}
      </p>
      {voteOptions.map(({ type, label, icon, color }) => {
        const percentage = getPercentage(votes[type]);
        return (
          <div key={type} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-medium">
                {icon}
                <span>{label}</span>
              </div>
              <span className="font-mono text-muted-foreground">{percentage.toFixed(0)}% ({votes[type]})</span>
            </div>
            <Progress value={percentage} className={`h-2 [&>div]:${color}`} />
          </div>
        );
      })}
       <p className="text-center text-xs text-muted-foreground pt-2">Total Votes: {totalVotes}</p>
    </div>
  );
}

export default function VoteControl({ locationId, initialVotes }: VoteControlProps) {
  const { toast } = useToast();
  const [showResults, setShowResults] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [voteCounts, setVoteCounts] = useState<VoteCounts>(initialVotes || { neutral: 0, positive: 0, fantastic: 0 });
  
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(castVote, initialFormState);

  useEffect(() => {
    // Check local storage only on the client-side after mount
    try {
      const voted = localStorage.getItem(`voted_on_${locationId}`);
      const viewedResults = localStorage.getItem(`viewed_results_${locationId}`);

      if (voted === 'true') {
        setUserHasVoted(true);
        setShowResults(true);
      } else if (viewedResults === 'true') {
        setShowResults(true);
      }
    } catch (e) {
      console.warn("Could not access localStorage. Voting may be affected.");
    }
  }, [locationId]);

  useEffect(() => {
    if (state.message && state.locationId === locationId) {
        if (state.type === 'success') {
             toast({
                title: 'Vote Recorded!',
                description: 'Thank you for your feedback.',
             });
             // Mark as voted in localStorage
             try {
                localStorage.setItem(`voted_on_${locationId}`, 'true');
             } catch (e) {
                console.warn("Could not write to localStorage.");
             }
             // Optimistically update counts and UI
             if (state.voteType) {
                 setVoteCounts(prev => ({...prev, [state.voteType!]: prev[state.voteType as VoteType] + 1}));
             }
             setUserHasVoted(true);
             setShowResults(true);
        } else if (state.type === 'error') {
            toast({
                title: 'Vote Failed',
                description: state.message,
                variant: 'destructive',
            });
        }
    }
  }, [state, toast, locationId]);

  const handleVote = (voteType: VoteType) => {
    const formData = new FormData();
    formData.append('locationId', locationId);
    formData.append('voteType', voteType);
    startTransition(() => {
      formAction(formData);
    });
  };

  const handleSkipToResults = () => {
    try {
      localStorage.setItem(`viewed_results_${locationId}`, 'true');
    } catch (e) {
      console.warn("Could not write to localStorage.");
    }
    setShowResults(true);
  };
  
  return (
    <TooltipProvider>
      <div className="pt-4">
        <Card className="bg-card/50 border-primary/20 shadow-sm">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="font-headline text-xl text-primary">
              {showResults ? "Proposal Results" : "Vote on this Action"}
            </CardTitle>
            {!showResults && (
              <CardDescription>How do you feel about this proposal?</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {showResults ? (
              <VoteResults votes={voteCounts} userHasVoted={userHasVoted} />
            ) : (
              <>
                <div className="flex justify-around items-center">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="flex flex-col h-auto p-3 space-y-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                    onClick={() => handleVote('neutral')}
                    disabled={isPending}
                  >
                    <Meh className="h-10 w-10 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">Neutral</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="flex flex-col h-auto p-3 space-y-1 hover:bg-green-100 dark:hover:bg-green-900/50"
                    onClick={() => handleVote('positive')}
                    disabled={isPending}
                  >
                    <Smile className="h-10 w-10 text-green-500" />
                    <span className="text-xs text-muted-foreground">Positive</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="flex flex-col h-auto p-3 space-y-1 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    onClick={() => handleVote('fantastic')}
                    disabled={isPending}
                  >
                    <Star className="h-10 w-10 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Fantastic!</span>
                  </Button>
                  {isPending && <Loader2 className="absolute h-6 w-6 animate-spin text-primary" />}
                </div>
                <div className="text-center mt-4 pt-4 border-t border-dashed border-border/70">
                  <Button
                      variant="link"
                      className="text-muted-foreground hover:text-accent"
                      onClick={handleSkipToResults}
                      disabled={isPending}
                  >
                      <BarChart2 className="mr-2 h-4 w-4" />
                      See what others voted
                  </Button>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1 px-4">
                    <p>
                        Note: Viewing results first will prevent you from voting on this proposal.
                    </p>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>To ensure fair and unbiased results, we only show aggregated data after a vote is cast or skipped.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
