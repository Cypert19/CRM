"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

type AvatarProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

function Avatar({ src, name, size = "md", className, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-elevated",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <AvatarPrimitive.Image
        className="h-full w-full object-cover"
        src={src ?? undefined}
        alt={name}
      />
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center bg-accent-primary/20 font-medium text-accent-glow"
        delayMs={600}
      >
        {getInitials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export { Avatar };
