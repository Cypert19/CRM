import { cn } from "@/lib/utils";

type StatusIndicatorProps = {
  color: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
};

function StatusIndicator({
  color,
  size = "sm",
  pulse = false,
  className,
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  return (
    <span className={cn("relative inline-flex", className)}>
      <span
        className={cn("inline-block rounded-full", sizeClasses[size])}
        style={{ backgroundColor: color }}
      />
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-40 animate-ping",
            sizeClasses[size]
          )}
          style={{ backgroundColor: color }}
        />
      )}
    </span>
  );
}

export { StatusIndicator };
