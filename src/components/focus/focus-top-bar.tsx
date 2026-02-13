"use client";

import { useEffect, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  SkipForward,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/gradient-button";
import { useFocusStore } from "@/stores/focus-store";

export function FocusTopBar({
  onMarkDone,
}: {
  onMarkDone: () => Promise<void>;
}) {
  const {
    queue,
    currentIndex,
    focusStartedAt,
    exitFocus,
    goToNext,
    goToPrevious,
  } = useFocusStore();

  const [elapsed, setElapsed] = useState(0);
  const [marking, setMarking] = useState(false);

  // Timer
  useEffect(() => {
    if (!focusStartedAt) return;
    const start = new Date(focusStartedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [focusStartedAt]);

  // Reset timer on task change
  useEffect(() => {
    setElapsed(0);
  }, [currentIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitFocus();
      } else if (e.key === "ArrowRight" && !e.metaKey && !e.ctrlKey) {
        goToNext();
      } else if (e.key === "ArrowLeft" && !e.metaKey && !e.ctrlKey) {
        goToPrevious();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleMarkDone();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const completedCount = queue.filter((q) => q.completedInSession).length;
  const progress = queue.length > 0 ? ((currentIndex + 1) / queue.length) * 100 : 0;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex >= queue.length - 1;

  async function handleMarkDone() {
    setMarking(true);
    await onMarkDone();
    setMarking(false);
  }

  return (
    <div className="relative shrink-0">
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border-glass">
        <div
          className="h-full bg-gradient-to-r from-accent-primary to-accent-glow transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex h-14 items-center justify-between border-b border-border-glass px-4">
        {/* Left: Exit + Nav */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={exitFocus}
            className="h-8 w-8 p-0"
            title="Exit Focus Mode (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="mx-2 h-5 w-px bg-border-glass" />

          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            disabled={isFirst}
            className="h-8 w-8 p-0"
            title="Previous task (←)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium text-text-primary min-w-[100px] text-center">
            Task {currentIndex + 1} of {queue.length}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={isLast}
            className="h-8 w-8 p-0"
            title="Next task (→)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {completedCount > 0 && (
            <span className="ml-2 text-xs text-signal-success">
              {completedCount} done
            </span>
          )}
        </div>

        {/* Right: Actions + Timer */}
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-1.5 text-text-tertiary">
            <Timer className="h-3.5 w-3.5" />
            <span className="text-xs font-mono">{formatTime(elapsed)}</span>
          </div>

          <div className="h-5 w-px bg-border-glass" />

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={isLast}
            title="Skip to next"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip
          </Button>

          <Button
            size="sm"
            onClick={handleMarkDone}
            disabled={marking}
            title="Mark done & next (⌘+Enter)"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {marking ? "Saving..." : "Done & Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
