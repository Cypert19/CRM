"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  CheckSquare,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Briefcase,
  Play,
  ListChecks,
  X,
  Square,
  CheckSquare as CheckSquareFilled,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskForm } from "./task-form";
import { updateTask, type TaskWithRelations } from "@/actions/tasks";
import { useFocusStore } from "@/stores/focus-store";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

const statusIcons: Record<string, typeof Circle> = {
  "To Do": Circle,
  "In Progress": Clock,
  Done: CheckCircle2,
  Cancelled: XCircle,
};

export function TasksView({ tasks }: { tasks: TaskWithRelations[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);

  const {
    queue,
    isSelecting,
    selectedTaskIds,
    toggleSelecting,
    toggleTaskSelection,
    addToQueue,
    clearSelection,
    startFocus,
  } = useFocusStore();

  const handleToggle = async (
    e: React.MouseEvent,
    task: TaskWithRelations
  ) => {
    e.stopPropagation();
    const newStatus = task.status === "Done" ? "To Do" : "Done";
    const result = await updateTask({ id: task.id, status: newStatus });
    if (result.success)
      toast.success(
        newStatus === "Done" ? "Task completed" : "Task reopened"
      );
    else toast.error("Failed to update task");
  };

  const handleAddToQueue = () => {
    if (selectedTaskIds.length === 0) return;
    addToQueue(selectedTaskIds);
    toast.success(`${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? "s" : ""} added to focus queue`);
  };

  const handleRowClick = (task: TaskWithRelations) => {
    if (isSelecting) {
      toggleTaskSelection(task.id);
    } else {
      router.push(`/tasks/${task.id}`);
    }
  };

  if (tasks.length === 0) {
    return (
      <>
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create your first task."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          }
        />
        <TaskForm open={formOpen} onOpenChange={setFormOpen} />
      </>
    );
  }

  const grouped = {
    "To Do": tasks.filter((t) => t.status === "To Do"),
    "In Progress": tasks.filter((t) => t.status === "In Progress"),
    Done: tasks.filter((t) => t.status === "Done"),
  };

  const isSelected = (taskId: string) => selectedTaskIds.includes(taskId);
  const isInQueue = (taskId: string) =>
    queue.some((q) => q.taskId === taskId);

  return (
    <>
      <PageHeader title="Tasks" description="Track your action items">
        <div className="flex items-center gap-2">
          {/* Start Focus button — visible when queue has items and not in selection mode */}
          {queue.length > 0 && !isSelecting && (
            <Button onClick={startFocus} variant="default" size="sm">
              <Play className="h-4 w-4" />
              Start Focus ({queue.length})
            </Button>
          )}

          {/* Focus Queue / Cancel Selection toggle */}
          <Button
            onClick={isSelecting ? () => clearSelection() : toggleSelecting}
            variant={isSelecting ? "ghost" : "outline"}
            size="sm"
          >
            {isSelecting ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <ListChecks className="h-4 w-4" />
                Focus Queue
                {queue.length > 0 && (
                  <Badge variant="default" className="ml-1.5">
                    {queue.length}
                  </Badge>
                )}
              </>
            )}
          </Button>

          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </PageHeader>

      <div className="mt-6 space-y-6">
        {Object.entries(grouped).map(([status, items]) => (
          <div key={status}>
            <h3 className="mb-3 text-sm font-semibold text-text-secondary">
              {status} ({items.length})
            </h3>
            <div className="space-y-2">
              {items.map((task) => {
                const Icon = statusIcons[task.status] || Circle;
                const assignee = task.users as TaskWithRelations["users"];
                const deal = task.deals as TaskWithRelations["deals"];
                const selected = isSelected(task.id);
                const queued = isInQueue(task.id);

                return (
                  <GlassCard
                    key={task.id}
                    hover
                    className={`flex items-center gap-4 !p-4 cursor-pointer transition-all ${
                      selected
                        ? "!border-accent-primary/40 !bg-accent-primary/5"
                        : ""
                    } ${queued && !isSelecting ? "!border-accent-primary/20" : ""}`}
                    onClick={() => handleRowClick(task)}
                  >
                    {/* Selection checkbox */}
                    {isSelecting && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskSelection(task.id);
                        }}
                        className="focus-ring shrink-0 rounded"
                      >
                        {selected ? (
                          <CheckSquareFilled className="h-5 w-5 text-accent-primary" />
                        ) : (
                          <Square className="h-5 w-5 text-text-tertiary" />
                        )}
                      </button>
                    )}

                    {/* Status toggle (hidden during selection) */}
                    {!isSelecting && (
                      <button
                        onClick={(e) => handleToggle(e, task)}
                        className="focus-ring shrink-0 rounded-full"
                      >
                        <Icon
                          className={`h-5 w-5 ${task.status === "Done" ? "text-signal-success" : "text-text-tertiary"}`}
                        />
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium ${task.status === "Done" ? "text-text-tertiary line-through" : "text-text-primary"}`}
                        >
                          {task.title}
                        </p>
                        {queued && !isSelecting && (
                          <Badge variant="default" className="text-[10px] py-0 px-1.5">
                            In Queue
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {task.due_date && (
                          <span className="text-xs text-text-tertiary">
                            {new Date(task.due_date).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        )}
                        {task.task_type && task.task_type !== "Other" && (
                          <Badge variant="cyan">{task.task_type}</Badge>
                        )}
                        {deal && (
                          <Badge variant="default">
                            <Briefcase className="mr-1 h-2.5 w-2.5" />
                            {deal.title}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {assignee && (
                        <div
                          className="flex items-center gap-1.5"
                          title={assignee.full_name}
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-elevated">
                            {assignee.avatar_url ? (
                              <img
                                src={assignee.avatar_url}
                                alt=""
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-3 w-3 text-text-tertiary" />
                            )}
                          </div>
                          <span className="hidden sm:inline text-xs text-text-tertiary max-w-[80px] truncate">
                            {assignee.full_name}
                          </span>
                        </div>
                      )}
                      <Badge
                        variant={
                          task.priority === "Urgent"
                            ? "danger"
                            : task.priority === "High"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating action bar when tasks are selected */}
      <AnimatePresence>
        {isSelecting && selectedTaskIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
          >
            <div className="glass-panel flex items-center gap-4 rounded-2xl px-6 py-3 shadow-lg">
              <span className="text-sm font-medium text-text-primary">
                {selectedTaskIds.length} task
                {selectedTaskIds.length > 1 ? "s" : ""} selected
              </span>
              <div className="h-4 w-px bg-border-glass" />
              <Button size="sm" onClick={handleAddToQueue}>
                <Plus className="h-4 w-4" />
                Add to Queue
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearSelection()}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TaskForm open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
