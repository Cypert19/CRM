"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, PartyPopper } from "lucide-react";
import { useFocusStore } from "@/stores/focus-store";
import { getTask, updateTask, type TaskWithRelations } from "@/actions/tasks";
import { FocusTopBar } from "./focus-top-bar";
import { FocusTaskDetail } from "./focus-task-detail";
import { FocusAIChat } from "./focus-ai-chat";
import { FocusQueueTray } from "./focus-queue-tray";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/gradient-button";
import { toast } from "sonner";

export function FocusModeOverlay() {
  const {
    isActive,
    queue,
    currentIndex,
    exitFocus,
    goToNext,
    markCurrentCompleted,
    clearQueue,
  } = useFocusStore();

  const [currentTask, setCurrentTask] = useState<TaskWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [taskTitles, setTaskTitles] = useState<
    { id: string; title: string; priority: string }[]
  >([]);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Fetch current task when index changes
  const fetchTask = useCallback(async () => {
    if (!isActive || queue.length === 0) return;

    const item = queue[currentIndex];
    if (!item) return;

    setLoading(true);
    setCurrentTask(null);

    const result = await getTask(item.taskId);
    if (result.success && result.data) {
      setCurrentTask(result.data);
    } else {
      // Task might have been deleted — skip
      toast.error("Task not found, skipping...");
      if (currentIndex < queue.length - 1) {
        goToNext();
      }
    }
    setLoading(false);
  }, [isActive, queue, currentIndex, goToNext]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // Fetch all task titles for the queue tray
  useEffect(() => {
    if (!isActive || queue.length === 0) return;
    setSessionComplete(false);

    async function fetchTitles() {
      const titles = await Promise.all(
        queue.map(async (item) => {
          const result = await getTask(item.taskId);
          if (result.success && result.data) {
            return {
              id: item.taskId,
              title: result.data.title,
              priority: result.data.priority,
            };
          }
          return { id: item.taskId, title: "Unknown", priority: "Medium" };
        })
      );
      setTaskTitles(titles);
    }

    fetchTitles();
  }, [isActive, queue]);

  // Handle "Mark Done & Next"
  const handleMarkDone = async () => {
    if (!currentTask) return;

    const result = await updateTask({ id: currentTask.id, status: "Done" });
    if (result.success) {
      toast.success("Task marked as done!");
      markCurrentCompleted();

      // Check if this was the last task
      if (currentIndex >= queue.length - 1) {
        setSessionComplete(true);
      } else {
        goToNext();
      }
    } else {
      toast.error("Failed to update task");
    }
  };

  // Handle session complete → exit
  const handleFinishSession = () => {
    setSessionComplete(false);
    clearQueue();
    exitFocus();
  };

  if (!isActive) return null;

  const currentTaskId = queue[currentIndex]?.taskId;
  const completedCount = queue.filter((q) => q.completedInSession).length;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col bg-bg-base/[0.98] backdrop-blur-sm"
        >
          {/* Session Complete Screen */}
          {sessionComplete ? (
            <div className="flex flex-1 items-center justify-center">
              <GlassCard className="max-w-md text-center !p-8">
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-signal-success/10">
                    <PartyPopper className="h-8 w-8 text-signal-success" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">
                  Focus Session Complete!
                </h2>
                <p className="text-sm text-text-secondary mb-6">
                  You completed {completedCount} of {queue.length} task
                  {queue.length > 1 ? "s" : ""} in this session.
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="ghost" onClick={() => setSessionComplete(false)}>
                    Review Tasks
                  </Button>
                  <Button onClick={handleFinishSession}>
                    Back to Tasks
                  </Button>
                </div>
              </GlassCard>
            </div>
          ) : (
            <>
              {/* Top Bar */}
              <FocusTopBar onMarkDone={handleMarkDone} />

              {/* Main Content: Task Detail (left) + AI Chat (right) */}
              <div className="flex flex-1 min-h-0">
                {/* Task Detail Panel */}
                <div className="flex-[3] min-w-0 overflow-hidden">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent-primary" />
                        <p className="mt-3 text-sm text-text-tertiary">
                          Loading task...
                        </p>
                      </div>
                    </div>
                  ) : currentTask ? (
                    <FocusTaskDetail task={currentTask} />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-text-tertiary">
                        No task selected
                      </p>
                    </div>
                  )}
                </div>

                {/* AI Chat Panel */}
                <div className="flex-[2] min-w-[360px] max-w-[480px]">
                  {currentTaskId ? (
                    <FocusAIChat
                      taskId={currentTaskId}
                      taskTitle={currentTask?.title || "Loading..."}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center border-l border-border-glass">
                      <p className="text-sm text-text-tertiary">
                        Select a task to start
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Queue Tray */}
              <FocusQueueTray taskTitles={taskTitles} />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
