import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TownLoading() {
  return (
    <div className="space-y-8">
      <Card className="bg-card rounded-lg shadow-md p-6 md:p-8">
        <Skeleton className="h-10 w-3/5 mb-2" />
        <Skeleton className="h-6 w-2/5 mb-6" />
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-8 w-1/4" />
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-5 w-3/4" />
        </CardHeader>
        <CardContent className="text-center py-12">
          <Spinner size={48} />
          <p className="mt-4 text-muted-foreground">Loading locations...</p>
        </CardContent>
      </Card>
    </div>
  );
}
