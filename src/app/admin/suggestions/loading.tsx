
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminSuggestionsLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3">
                <Skeleton className="relative h-48 md:h-full w-full" />
                <div className="p-4 space-y-3 md:col-span-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-6 w-1/2 mb-1" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="text-xs text-muted-foreground space-y-1 pt-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div className="pt-2">
                    <Skeleton className="h-9 w-48" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
          <div className="text-center py-8">
            <Spinner size={40} />
            <p className="mt-3 text-muted-foreground">Loading suggestions...</p>
          </div>
        </CardContent>
         <CardFooter className="text-center">
            <Skeleton className="h-10 w-36 mx-auto" />
        </CardFooter>
      </Card>
    </div>
  );
}
