"use client";

import {
  Calendar,
  Clock,
  User,
  Briefcase,
  FileText,
  Tag,
  Target,
  UserCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import type { TaskWithRelations } from "@/actions/tasks";

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

const statusVariant = (s: string) => {
  switch (s) {
    case "Done":
      return "success" as const;
    case "In Progress":
      return "info" as const;
    case "Cancelled":
      return "danger" as const;
    default:
      return "secondary" as const;
  }
};

const typeVariant = (t: string) => {
  switch (t) {
    case "Call":
    case "Email":
      return "cyan" as const;
    case "Meeting":
    case "Demo":
      return "info" as const;
    case "Proposal":
      return "success" as const;
    case "Training":
    case "Consulting":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
};

export function FocusTaskDetail({ task }: { task: TaskWithRelations }) {
  const assignee = task.users as TaskWithRelations["users"];
  const creator = task.creator as TaskWithRelations["creator"];
  const deal = task.deals as TaskWithRelations["deals"];
  const contact = task.contacts as TaskWithRelations["contacts"];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Title + Badges */}
      <div>
        <h1 className="text-xl font-bold text-text-primary leading-tight">
          {task.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
          <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
          {task.task_type && (
            <Badge variant={typeVariant(task.task_type)}>{task.task_type}</Badge>
          )}
          {task.category && (
            <Badge variant="secondary">
              <Tag className="mr-1 h-2.5 w-2.5" />
              {task.category}
            </Badge>
          )}
        </div>
      </div>

      {/* Description / Notes */}
      {task.notes && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-accent-primary" />
            <h3 className="text-sm font-semibold text-text-primary">
              Description / Notes
            </h3>
          </div>
          <div className="rounded-lg bg-bg-elevated/30 px-4 py-3">
            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
              {task.notes}
            </p>
          </div>
        </GlassCard>
      )}

      {/* Task Details Grid */}
      <GlassCard>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Assignee */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10">
              <User className="h-4 w-4 text-accent-primary" />
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary">Assignee</p>
              <p className="text-sm font-medium text-text-primary">
                {assignee?.full_name || "Unassigned"}
              </p>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-warning/10">
              <Calendar className="h-4 w-4 text-signal-warning" />
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary">Due Date</p>
              <p className="text-sm font-medium text-text-primary">
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }) + (task.due_time ? ` at ${task.due_time}` : "")
                  : "—"}
              </p>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10">
              <Clock className="h-4 w-4 text-accent-primary" />
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary">Estimated</p>
              <p className="text-sm font-medium text-text-primary">
                {task.estimated_minutes
                  ? `${task.estimated_minutes} minutes`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-success/10">
              <UserCircle className="h-4 w-4 text-signal-success" />
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary">Created By</p>
              <p className="text-sm font-medium text-text-primary">
                {creator?.full_name || "Unknown"}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Linked Deal */}
      {deal && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="h-4 w-4 text-accent-primary" />
            <h3 className="text-sm font-semibold text-text-primary">
              Linked Deal
            </h3>
          </div>
          <a
            href={`/deals/${deal.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-lg bg-bg-elevated/30 px-4 py-3 transition-colors hover:bg-bg-elevated/50"
          >
            <div>
              <p className="text-sm font-medium text-text-primary group-hover:text-accent-primary transition-colors">
                {deal.title}
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                ${deal.value.toLocaleString()}
              </p>
            </div>
            <Badge variant="default">View Deal →</Badge>
          </a>
        </GlassCard>
      )}

      {/* Linked Contact */}
      {contact && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-accent-primary" />
            <h3 className="text-sm font-semibold text-text-primary">
              Linked Contact
            </h3>
          </div>
          <a
            href={`/contacts/${contact.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-lg bg-bg-elevated/30 px-4 py-3 transition-colors hover:bg-bg-elevated/50"
          >
            <div>
              <p className="text-sm font-medium text-text-primary group-hover:text-accent-primary transition-colors">
                {contact.first_name} {contact.last_name}
              </p>
              {contact.email && (
                <p className="text-xs text-text-tertiary mt-0.5">
                  {contact.email}
                </p>
              )}
            </div>
            <Badge variant="default">View Contact →</Badge>
          </a>
        </GlassCard>
      )}
    </div>
  );
}
