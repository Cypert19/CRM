"use client";

import { useState } from "react";
import { Plus, CheckSquare, Circle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskForm } from "./task-form";
import { updateTask } from "@/actions/tasks";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

const statusIcons: Record<string, typeof Circle> = {
  "To Do": Circle,
  "In Progress": Clock,
  "Done": CheckCircle2,
  "Cancelled": XCircle,
};

export function TasksView({ tasks }: { tasks: Tables<"tasks">[] }) {
  const [formOpen, setFormOpen] = useState(false);

  const handleToggle = async (task: Tables<"tasks">) => {
    const newStatus = task.status === "Done" ? "To Do" : "Done";
    const result = await updateTask({ id: task.id, status: newStatus });
    if (result.success) toast.success(newStatus === "Done" ? "Task completed" : "Task reopened");
    else toast.error("Failed to update task");
  };

  if (tasks.length === 0) {
    return (
      <>
        <EmptyState icon={CheckSquare} title="No tasks yet" description="Create your first task." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Add Task</Button>} />
        <TaskForm open={formOpen} onOpenChange={setFormOpen} />
      </>
    );
  }

  const grouped = {
    "To Do": tasks.filter((t) => t.status === "To Do"),
    "In Progress": tasks.filter((t) => t.status === "In Progress"),
    "Done": tasks.filter((t) => t.status === "Done"),
  };

  return (
    <>
      <PageHeader title="Tasks" description="Track your action items">
        <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Add Task</Button>
      </PageHeader>
      <div className="mt-6 space-y-6">
        {Object.entries(grouped).map(([status, items]) => (
          <div key={status}>
            <h3 className="mb-3 text-sm font-semibold text-text-secondary">{status} ({items.length})</h3>
            <div className="space-y-2">
              {items.map((task) => {
                const Icon = statusIcons[task.status] || Circle;
                return (
                  <GlassCard key={task.id} className="flex items-center gap-4 p-4">
                    <button onClick={() => handleToggle(task)} className="focus-ring shrink-0 rounded-full">
                      <Icon className={`h-5 w-5 ${task.status === "Done" ? "text-signal-success" : "text-text-tertiary"}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === "Done" ? "text-text-tertiary line-through" : "text-text-primary"}`}>{task.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {task.due_date && <span className="text-xs text-text-tertiary">{new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                        {task.task_type && task.task_type !== "Other" && <Badge variant="secondary">{task.task_type}</Badge>}
                      </div>
                    </div>
                    <Badge variant={task.priority === "Urgent" ? "danger" : task.priority === "High" ? "warning" : "secondary"}>{task.priority}</Badge>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <TaskForm open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
