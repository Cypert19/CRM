import { Skeleton } from "@/components/ui/skeleton";
export default function NotesLoading() {
  return <div className="space-y-6"><div className="flex items-center justify-between"><Skeleton className="h-8 w-24" /><Skeleton className="h-9 w-28" /></div><div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div></div>;
}
