
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/Spinner';

export default function PrivacyPolicyLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-5 w-1/2 mx-auto mt-2" />
        </CardHeader>
        <CardContent className="pt-8 px-6 md:px-8 space-y-10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-1/2 mb-3" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
              {i % 2 === 0 && <Skeleton className="h-5 w-full mt-2" />}
            </div>
          ))}
          <div className="text-center py-8">
            <Spinner size={40} />
            <p className="mt-3 text-muted-foreground">Loading policy...</p>
          </div>
          <div className="pt-6 text-center">
            <Skeleton className="h-10 w-32 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    