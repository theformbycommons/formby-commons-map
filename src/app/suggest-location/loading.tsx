import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuggestLocationLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Skeleton className="h-14 w-14 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
          <Skeleton className="h-5 w-full mx-auto mb-1" />
          <Skeleton className="h-5 w-5/6 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-1/3 ml-auto" />
           <div className="text-center py-8">
            <Spinner size={36} />
            <p className="mt-3 text-muted-foreground">Loading form...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
