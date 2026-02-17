"use client";

import { useMemo, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { AIMessage } from "@/stores/ai-store";

type AIMessageBubbleProps = {
  message: AIMessage;
  userName?: string;
};

/**
 * Custom markdown components styled for the glassmorphism dark theme.
 * Applied only to assistant messages.
 */
const markdownComponents = {
  // Paragraphs
  p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className="mb-3 last:mb-0 leading-relaxed" {...props}>
      {children}
    </p>
  ),

  // Headings
  h1: ({ children, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1 className="mb-3 mt-4 first:mt-0 text-base font-bold text-text-primary" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mb-2 mt-4 first:mt-0 text-sm font-bold text-text-primary" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mb-2 mt-3 first:mt-0 text-sm font-semibold text-text-primary" {...props}>
      {children}
    </h3>
  ),

  // Bold / Italic
  strong: ({ children, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-text-primary" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: ComponentPropsWithoutRef<"em">) => (
    <em className="italic text-text-secondary" {...props}>
      {children}
    </em>
  ),

  // Links
  a: ({ children, href, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent-primary underline decoration-accent-primary/30 underline-offset-2 hover:decoration-accent-primary transition-colors"
      {...props}
    >
      {children}
    </a>
  ),

  // Unordered lists
  ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mb-3 last:mb-0 ml-1 list-none space-y-1.5" {...props}>
      {children}
    </ul>
  ),

  // Ordered lists
  ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mb-3 last:mb-0 ml-1 list-none space-y-1.5 [counter-reset:item]" {...props}>
      {children}
    </ol>
  ),

  // List items
  li: ({ children, ...props }: ComponentPropsWithoutRef<"li">) => {
    // Check if parent is an ordered list via the "ordered" prop from react-markdown
    const ordered = (props as Record<string, unknown>).ordered;
    return (
      <li
        className={cn(
          "relative pl-5 text-text-secondary",
          ordered
            ? "[counter-increment:item] before:content-[counter(item)'.'] before:absolute before:left-0 before:text-accent-cyan before:font-semibold before:text-xs"
            : "before:content-['•'] before:absolute before:left-1 before:text-accent-primary before:font-bold"
        )}
        {...props}
      >
        {children}
      </li>
    );
  },

  // Inline code
  code: ({ children, className, ...props }: ComponentPropsWithoutRef<"code">) => {
    // Check if this is inside a <pre> (code block) vs inline
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className={cn("text-[13px] leading-relaxed", className)} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded-md bg-bg-elevated/80 border border-border-subtle px-1.5 py-0.5 text-[13px] font-mono text-accent-cyan"
        {...props}
      >
        {children}
      </code>
    );
  },

  // Code blocks
  pre: ({ children, ...props }: ComponentPropsWithoutRef<"pre">) => (
    <pre
      className="mb-3 last:mb-0 overflow-x-auto rounded-lg bg-bg-elevated/60 border border-border-subtle p-3 text-[13px] font-mono leading-relaxed text-text-secondary"
      {...props}
    >
      {children}
    </pre>
  ),

  // Blockquotes
  blockquote: ({ children, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="mb-3 last:mb-0 border-l-2 border-accent-violet/40 pl-3 italic text-text-secondary"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr className="my-4 border-border-glass" {...props} />
  ),

  // Tables
  table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="mb-3 last:mb-0 overflow-x-auto rounded-lg border border-border-subtle">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: ComponentPropsWithoutRef<"thead">) => (
    <thead className="border-b border-border-subtle bg-bg-elevated/40" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-text-primary" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td className="border-t border-border-subtle px-3 py-2 text-xs text-text-secondary" {...props}>
      {children}
    </td>
  ),
};

export function AIMessageBubble({ message, userName }: AIMessageBubbleProps) {
  const isAssistant = message.role === "assistant";

  const renderedContent = useMemo(() => {
    if (!isAssistant) {
      return <div className="whitespace-pre-wrap">{message.content}</div>;
    }

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {message.content}
      </ReactMarkdown>
    );
  }, [message.content, isAssistant]);

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
        {renderedContent}
      </div>
    </div>
  );
}
