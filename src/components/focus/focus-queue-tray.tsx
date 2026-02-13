"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useFocusStore } from "@/stores/focus-store";
import { cn } from "@/lib/utils";

type TaskTitle = {
  id: string;
  title: string;
  priority: string;
};

export function FocusQueueTray({ taskTitles }: { taskTitles: TaskTitle[] }) {
  const { queue, currentIndex, goToIndex } = useFocusStore();
  const [collapsed, setCollapsed] = useState(false);

  // Build a map for quick lookup
  const titleMap = new Map(taskTitles.map((t) => [t.id, t]));

  // Scroll current task into view
  useEffect(() => {
    const el = document.getElementById(`queue-pill-${currentIndex}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentIndex]);

  const priorityDot = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-signal-danger";
      case "High":
        return "bg-signal-warning";
      case "Medium":
        return "bg-signal-info";
      default:
        return "bg-text-tertiary";
    }
  };

  return (
    <div className="shrink-0 border-t border-border-glass bg-bg-glass/50">
      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-center gap-1 py-1 text-text-tertiary hover:text-text-secondary transition-colors"
      >
        {collapsed ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        <span className="text-[10px] font-medium uppercase tracking-wider">
          Queue ({queue.length})
        </span>
      </button>

      {/* Queue pills */}
      {!collapsed && (
        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 pt-1 scrollbar-thin">
          {queue.map((item, idx) => {
            const info = titleMap.get(item.taskId);
            const isCurrent = idx === currentIndex;
            const isDone = item.completedInSession;
            const title = info?.title || "Loading...";
            const priority = info?.priority || "Medium";

            return (
              <button
                key={item.taskId}
                id={`queue-pill-${idx}`}
                onClick={() => goToIndex(idx)}
                className={cn(
                  "relative flex items-center gap-2 shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                  isCurrent
                    ? "glass-panel !border-accent-primary/40 text-text-primary shadow-[0_0_12px_rgba(249,115,22,0.15)]"
                    : isDone
                      ? "bg-bg-elevated/30 text-text-tertiary"
                      : "bg-bg-elevated/30 text-text-secondary hover:bg-bg-elevated/50 hover:text-text-primary"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3 w-3 text-signal-success shrink-0" />
                ) : (
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      priorityDot(priority)
                    )}
                  />
                )}
                <span className={cn("max-w-[120px] truncate", isDone && "line-through")}>
                  {title}
                </span>
                {isCurrent && (
                  <div className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b bg-accent-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
