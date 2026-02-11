import { Skeleton } from "@/components/ui/skeleton";

export default function DealsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-[300px] shrink-0 space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
