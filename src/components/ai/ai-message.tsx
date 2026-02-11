"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { AIMessage } from "@/stores/ai-store";

type AIMessageBubbleProps = {
  message: AIMessage;
  userName?: string;
};

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
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}
