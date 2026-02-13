"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Circle, CheckCircle2, Plus, User } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/gradient-button";
import { TaskForm } from "@/components/tasks/task-form";
import { getTasks, updateTask, type TaskWithRelations } from "@/actions/tasks";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_GROUPS = ["To Do", "In Progress", "Done"] as const;

const priorityVariant = (p: string) => {
  switch (p) {
    case "Urgent":
      return "danger" as const;
    case "High":
      return "warning" as const;
    case "Medium":
      return "info" as const;
    default:
      return "secondary" as const;
  }
};

const typeVariant = (t: string | null) => {
  switch (t) {
    case "Call":
    case "Email":
      return "cyan" as const;
    case "Meeting":
    case "Demo":
      return "default" as const;
    default:
      return "secondary" as const;
  }
};

export function DealTasksTab({ dealId }: { dealId: string }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    const result = await getTasks({ deal_id: dealId });
    if (result.success && result.data) {
      setTasks(result.data);
    } else {
      toast.error(result.error || "Failed to load tasks");
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleStatus = async (e: React.MouseEvent, task: TaskWithRelations) => {
    e.stopPropagation();
    const newStatus = task.status === "Done" ? "To Do" : "Done";
    setTogglingId(task.id);
    const result = await updateTask({ id: task.id, status: newStatus });
    if (result.success && result.data) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: result.data!.status } : t))
      );
    } else {
      toast.error(result.error || "Failed to update task");
    }
    setTogglingId(null);
  };

  const grouped = STATUS_GROUPS.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<string, TaskWithRelations[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Tasks ({tasks.length})
        </h3>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckSquare className="mb-3 h-10 w-10 text-text-tertiary" />
            <p className="text-sm font-medium text-text-secondary">No tasks yet</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Create a task to track action items for this deal.
            </p>
          </div>
        </GlassCard>
      ) : (
        STATUS_GROUPS.map((status) => {
          const group = grouped[status];
          if (!group || group.length === 0) return null;
          return (
            <div key={status} className="space-y-2">
              <h4 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                {status} ({group.length})
              </h4>
              <div className="space-y-2">
                {group.map((task) => {
                  const assignee = task.users as TaskWithRelations["users"];
                  return (
                    <GlassCard
                      key={task.id}
                      hover
                      className="!p-4 cursor-pointer"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={(e) => toggleStatus(e, task)}
                          disabled={togglingId === task.id}
                          className="mt-0.5 shrink-0 text-text-tertiary transition-colors hover:text-accent-primary disabled:opacity-50"
                          aria-label={task.status === "Done" ? "Mark as To Do" : "Mark as Done"}
                        >
                          {task.status === "Done" ? (
                            <CheckCircle2 className="h-5 w-5 text-signal-success" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium ${
                              task.status === "Done"
                                ? "text-text-tertiary line-through"
                                : "text-text-primary"
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Badge variant={priorityVariant(task.priority)}>
                              {task.priority}
                            </Badge>
                            {task.task_type && (
                              <Badge variant={typeVariant(task.task_type)}>
                                {task.task_type}
                              </Badge>
                            )}
                            {task.due_date && (
                              <span className="text-xs text-text-tertiary">
                                Due {formatRelativeTime(task.due_date)}
                              </span>
                            )}
                          </div>
                        </div>
                        {assignee && (
                          <div className="shrink-0 flex items-center gap-1.5" title={assignee.full_name}>
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-elevated">
                              {assignee.avatar_url ? (
                                <img src={assignee.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <User className="h-3 w-3 text-text-tertiary" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      <TaskForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) fetchTasks();
        }}
        dealId={dealId}
      />
    </div>
  );
}
