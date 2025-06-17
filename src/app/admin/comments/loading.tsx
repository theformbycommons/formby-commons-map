
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/Spinner'; // Assuming you have a Spinner component

export default function AdminCommentsLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
               <CardHeader className="pb-2 pt-3 px-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                        <Skeleton className="h-5 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="text-xs text-muted-foreground pt-1">
                  <Skeleton className="h-3 w-1/3 mb-1" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <div className="pt-2">
                  <Skeleton className="h-9 w-44" />
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="text-center py-8">
            <Spinner size={40} />
            <p className="mt-3 text-muted-foreground">Loading pending comments...</p>
          </div>
        </CardContent>
         <CardFooter className="text-center">
            <Skeleton className="h-10 w-36 mx-auto" />
        </CardFooter>
      </Card>
    </div>
  );
}
