
import { Skeleton } from "@/components/ui/skeleton";

export const FinanceiroLoadingState = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
      
      <Skeleton className="h-[400px] rounded-lg" />
      
      <Skeleton className="h-[300px] rounded-lg" />
    </div>
  );
};
