import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent-primary/20 text-accent-glow",
        secondary: "bg-bg-elevated text-text-secondary",
        success: "bg-signal-success/20 text-signal-success",
        warning: "bg-signal-warning/20 text-signal-warning",
        danger: "bg-signal-danger/20 text-signal-danger",
        info: "bg-signal-info/20 text-signal-info",
        cyan: "bg-accent-cyan/20 text-accent-cyan",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
