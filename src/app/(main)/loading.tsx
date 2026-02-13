import { Skeleton } from "@/components/ui/skeleton";

export default function MainLoading() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex w-60 flex-col gap-4 border-r p-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-full" />
        <div className="space-y-2 mt-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
