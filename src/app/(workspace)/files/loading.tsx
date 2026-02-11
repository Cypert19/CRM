import { Skeleton } from "@/components/ui/skeleton";
export default function FilesLoading() {
  return <div className="space-y-6"><Skeleton className="h-8 w-24" /><div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div></div>;
}
