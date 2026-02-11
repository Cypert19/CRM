import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs text-text-secondary">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            "focus-ring glass-panel-dense w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary",
            error && "border-signal-danger",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-signal-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
