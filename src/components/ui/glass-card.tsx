import * as React from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  glow?: "violet" | "cyan" | "success" | "warning" | "danger";
};

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = false, glow, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "glass-panel rounded-2xl p-6",
        hover && "glass-card-hover cursor-pointer",
        glow === "violet" && "glow-violet",
        glow === "cyan" && "glow-cyan",
        glow === "success" && "glow-success",
        glow === "warning" && "glow-warning",
        glow === "danger" && "glow-danger",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
