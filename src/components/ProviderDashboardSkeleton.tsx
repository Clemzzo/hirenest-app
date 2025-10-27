import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProviderDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Jobs Card Skeleton */}
        <Card className="border" style={{ borderColor: "#AD15B0" }}>
          <CardHeader>
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-12" />
          </CardContent>
        </Card>

        {/* Average Rating Card Skeleton */}
        <Card className="border" style={{ borderColor: "#AD15B0" }}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-12" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}