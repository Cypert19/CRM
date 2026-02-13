"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { CitationPopover } from "./citation-popover";
import type { AIMessage } from "@/stores/ai-store";

type AIMessageBubbleProps = {
  message: AIMessage;
  userName?: string;
};

type ContentPart =
  | { type: "text"; value: string }
  | { type: "link"; text: string; url: string }
  | { type: "citation"; title: string; url: string; excerpt?: string; raw: string };

/**
 * Parses message text into structured parts:
 * - Plain text segments
 * - Markdown links: [text](url)
 * - Full citations: 📋 [title](url) — "excerpt"
 */
function parseContent(text: string): ContentPart[] {
  if (!text) return [];

  const parts: ContentPart[] = [];
  // Match citations: 📋 [title](url) — "excerpt" or just 📋 [title](url)
  // Also matches plain [text](url) links
  const combinedRegex = /📋\s*\[([^\]]+)\]\(([^)]+)\)(?:\s*[—–-]\s*[""]([^""]+)[""])?|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      // Citation match: 📋 [title](url) — "excerpt"
      parts.push({
        type: "citation",
        title: match[1],
        url: match[2],
        excerpt: match[3] || undefined,
        raw: match[0],
      });
    } else {
      // Regular link match: [text](url)
      parts.push({
        type: "link",
        text: match[4],
        url: match[5],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

/**
 * Renders message content with:
 * - Markdown link support ([text](url) → clickable links)
 * - Citation popovers (📋 [title](url) — "excerpt" → glass pills with hover preview)
 */
function RichContent({ text }: { text: string }) {
  const elements = useMemo(() => {
    const parts = parseContent(text);
    if (parts.length === 0) return null;

    return parts.map((part, i) => {
      if (part.type === "citation") {
        return (
          <CitationPopover
            key={i}
            title={part.title}
            url={part.url}
            excerpt={part.excerpt}
          >
            <a
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-accent-primary/5 border border-accent-primary/10 px-1.5 py-0.5 text-xs cursor-pointer hover:bg-accent-primary/10 hover:border-accent-primary/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span>📋</span>
              <span className="text-accent-primary underline decoration-accent-primary/30 underline-offset-2">
                {part.title}
              </span>
            </a>
          </CitationPopover>
        );
      }

      if (part.type === "link") {
        return (
          <a
            key={i}
            href={part.url}
            target={part.url.startsWith("/") ? "_blank" : undefined}
            rel={part.url.startsWith("/") ? "noopener noreferrer" : undefined}
            className="text-accent-primary underline decoration-accent-primary/30 underline-offset-2 hover:decoration-accent-primary transition-colors"
          >
            {part.text}
          </a>
        );
      }

      // Text segment: render lines with newline handling and citation-line styling
      const lines = part.value.split("\n");
      return lines.map((line, j) => {
        const key = `${i}-${j}`;
        // Check for orphan citation lines (📋 without a link - rare edge case)
        const isCitationLine = line.trimStart().startsWith("📋");

        if (isCitationLine) {
          return (
            <span key={key}>
              {j > 0 && "\n"}
              <span className="inline-flex items-center gap-1 rounded-md bg-accent-primary/5 border border-accent-primary/10 px-1.5 py-0.5 text-xs">
                {line.trim()}
              </span>
            </span>
          );
        }

        return (
          <span key={key}>
            {j > 0 && "\n"}
            {line}
          </span>
        );
      });
    });
  }, [text]);

  return <div className="whitespace-pre-wrap">{elements}</div>;
}

export function AIMessageBubble({ message, userName }: AIMessageBubbleProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3",
        isAssistant ? "items-start" : "items-start flex-row-reverse"
      )}
    >
      {isAssistant ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-cyan">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
      ) : (
        <Avatar name={userName ?? "You"} size="sm" />
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
          isAssistant
            ? "glass-panel border-l-2 border-l-accent-cyan/30 text-text-primary"
            : "bg-accent-primary/20 text-text-primary"
        )}
      >
        {isAssistant ? (
          <RichContent text={message.content} />
        ) : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
      </div>
    </div>
  );
}
