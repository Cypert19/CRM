import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "gradient-button",
        secondary:
          "glass-panel text-accent-primary border-accent-primary/20 hover:bg-accent-primary/10",
        ghost:
          "text-text-secondary hover:text-text-primary hover:bg-bg-card/50",
        danger:
          "bg-signal-danger/10 text-signal-danger border border-signal-danger/20 hover:bg-signal-danger/20",
        outline:
          "glass-panel text-text-secondary hover:text-text-primary",
      },
      size: {
        sm: "h-8 rounded-lg px-3 text-xs",
        md: "h-9 rounded-lg px-4 text-sm",
        lg: "h-11 rounded-xl px-6 text-sm",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
