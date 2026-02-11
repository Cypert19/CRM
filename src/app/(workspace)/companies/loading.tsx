import { Skeleton } from "@/components/ui/skeleton";
export default function CompaniesLoading() {
  return <div className="space-y-6"><div className="flex items-center justify-between"><Skeleton className="h-8 w-36" /><Skeleton className="h-9 w-36" /></div><Skeleton className="h-96" /></div>;
}
