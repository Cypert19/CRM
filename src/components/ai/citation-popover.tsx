"use client";

import * as HoverCard from "@radix-ui/react-hover-card";
import { ExternalLink, FileText } from "lucide-react";

type CitationPopoverProps = {
  title: string;
  url: string;
  excerpt?: string;
  children: React.ReactNode;
};

/**
 * A hover card that appears when hovering over AI citation pills.
 * Shows the source title, excerpt, and a link to open the source.
 */
export function CitationPopover({
  title,
  url,
  excerpt,
  children,
}: CitationPopoverProps) {
  return (
    <HoverCard.Root openDelay={300} closeDelay={100}>
      <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="start"
          sideOffset={6}
          className="z-[100] w-72 rounded-xl border border-border-glass bg-bg-elevated/95 p-3.5 shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        >
          {/* Source title */}
          <div className="flex items-start gap-2 mb-2">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-cyan" />
            <p className="text-xs font-semibold text-text-primary leading-tight">
              {title}
            </p>
          </div>

          {/* Excerpt */}
          {excerpt && (
            <>
              <div className="mb-2 h-px bg-border-glass" />
              <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-4 italic">
                &ldquo;{excerpt}&rdquo;
              </p>
            </>
          )}

          {/* Link */}
          <div className="mt-2.5 flex justify-end">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-accent-primary/10 px-2 py-1 text-[10px] font-medium text-accent-primary hover:bg-accent-primary/20 transition-colors"
            >
              Open Source
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>

          <HoverCard.Arrow className="fill-bg-elevated/95" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
