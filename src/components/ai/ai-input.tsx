"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

type AIInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export function AIInput({ onSend, disabled }: AIInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="glass-panel-dense flex items-end gap-2 rounded-xl p-2">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Nexus AI anything..."
        disabled={disabled}
        rows={1}
        className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className={cn(
          "focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
          value.trim() && !disabled
            ? "bg-accent-primary text-white hover:bg-accent-glow"
            : "text-text-tertiary"
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
