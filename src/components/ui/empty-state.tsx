import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-accent-primary/10 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-bg-card">
          <Icon className="h-7 w-7 text-accent-primary" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-text-secondary">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export { EmptyState };
