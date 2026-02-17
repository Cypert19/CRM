"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  X,
  Check,
  Trash2,
  User,
  Calendar,
  Clock,
  Briefcase,
  FileText,
  CheckCircle2,
  Circle,
  Tag,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTask, deleteTask, type TaskWithRelations } from "@/actions/tasks";
import { getWorkspaceMembers } from "@/actions/workspace";
import { getDeals } from "@/actions/deals";
import { getContacts } from "@/actions/contacts";
import { TASK_STATUSES, TASK_PRIORITIES, TASK_TYPES, TASK_CATEGORIES } from "@/lib/constants";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

// ── Badge variant helpers ──────────────────────────────────────────────

function statusVariant(status: string | null) {
  switch (status) {
    case "To Do":
      return "secondary" as const;
    case "In Progress":
      return "info" as const;
    case "Done":
      return "success" as const;
    case "Cancelled":
      return "danger" as const;
    default:
      return "secondary" as const;
  }
}

function priorityVariant(priority: string | null) {
  switch (priority) {
    case "Urgent":
      return "danger" as const;
    case "High":
      return "warning" as const;
    case "Medium":
      return "info" as const;
    case "Low":
      return "secondary" as const;
    default:
      return "secondary" as const;
  }
}

function typeVariant(type: string | null) {
  switch (type) {
    case "Call":
    case "Email":
      return "cyan" as const;
    case "Meeting":
    case "Demo":
      return "info" as const;
    default:
      return "secondary" as const;
  }
}

// ── Date formatting helpers ────────────────────────────────────────────

function formatDate(date: string | null): string {
  if (!date) return "\u2014";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: string | null, time: string | null): string {
  if (!date) return "\u2014";
  const dateStr = formatDate(date);
  if (!time) return dateStr;
  return `${dateStr} at ${time}`;
}

function categoryLabel(cat: string | null): string {
  if (!cat) return "\u2014";
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

// ── Main Component ─────────────────────────────────────────────────────

export function TaskDetail({ task: initialTask }: { task: TaskWithRelations }) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Field states
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState<string>(task.status || "To Do");
  const [priority, setPriority] = useState<string>(task.priority || "Medium");
  const [taskType, setTaskType] = useState<string>(task.task_type || "Other");
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [dueTime, setDueTime] = useState(task.due_time || "");
  const [assigneeId, setAssigneeId] = useState(task.assignee_id || "");
  const [dealId, setDealId] = useState(task.deal_id || "");
  const [contactId, setContactId] = useState(task.contact_id || "");
  const [notes, setNotes] = useState(task.notes || "");
  const [category, setCategory] = useState(task.category || "");
  const [startDate, setStartDate] = useState(task.start_date || "");
  const [endDate, setEndDate] = useState(task.end_date || "");
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>(
    task.estimated_minutes != null ? String(task.estimated_minutes) : ""
  );

  // Picker data (lazy-loaded)
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [deals, setDeals] = useState<Tables<"deals">[]>([]);
  const [contacts, setContacts] = useState<Tables<"contacts">[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Reset field state to match the current task
  const resetFields = (t: TaskWithRelations) => {
    setTitle(t.title);
    setStatus(t.status || "To Do");
    setPriority(t.priority || "Medium");
    setTaskType(t.task_type || "Other");
    setDueDate(t.due_date || "");
    setDueTime(t.due_time || "");
    setAssigneeId(t.assignee_id || "");
    setDealId(t.deal_id || "");
    setContactId(t.contact_id || "");
    setNotes(t.notes || "");
    setCategory(t.category || "");
    setStartDate(t.start_date || "");
    setEndDate(t.end_date || "");
    setEstimatedMinutes(t.estimated_minutes != null ? String(t.estimated_minutes) : "");
  };

  // ── Edit lifecycle ───────────────────────────────────────────────────

  const startEdit = async () => {
    resetFields(task);
    setEditing(true);
    setLoadingOptions(true);
    try {
      const [membersRes, dealsRes, contactsRes] = await Promise.all([
        getWorkspaceMembers(),
        getDeals(),
        getContacts(),
      ]);
      if (membersRes.success && membersRes.data) {
        setMembers(membersRes.data.map((m) => ({ id: m.users.id, full_name: m.users.full_name })));
      }
      if (dealsRes.success && dealsRes.data) setDeals(dealsRes.data);
      if (contactsRes.success && contactsRes.data) setContacts(contactsRes.data);
    } finally {
      setLoadingOptions(false);
    }
  };

  const cancelEdit = () => {
    resetFields(task);
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);

    const result = await updateTask({
      id: task.id,
      title: title.trim(),
      status,
      priority,
      task_type: taskType,
      due_date: dueDate || null,
      due_time: dueTime || null,
      assignee_id: assigneeId || null,
      deal_id: dealId || null,
      contact_id: contactId || null,
      notes: notes.trim() || null,
      category: category || null,
      start_date: startDate || null,
      end_date: endDate || null,
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
    });

    setSaving(false);

    if (result.success && result.data) {
      // Preserve the relations from the previous task state, overlay the updated scalar fields
      setTask((prev) => ({ ...prev, ...result.data } as TaskWithRelations));
      setEditing(false);
      toast.success("Task updated");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update task");
    }
  };

  // ── Quick actions ────────────────────────────────────────────────────

  const toggleStatus = async () => {
    const newStatus = task.status === "Done" ? "To Do" : "Done";
    const result = await updateTask({ id: task.id, status: newStatus });
    if (result.success && result.data) {
      setTask((prev) => ({ ...prev, ...result.data } as TaskWithRelations));
      toast.success(newStatus === "Done" ? "Task marked as done" : "Task reopened");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    const result = await deleteTask(task.id);
    if (result.success) {
      toast.success("Task deleted");
      router.push("/tasks");
    } else {
      toast.error(result.error || "Failed to delete task");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
        {!editing ? (
          <Button onClick={startEdit} variant="secondary" size="sm">
            <Pencil className="h-3.5 w-3.5" />
            Edit Task
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={cancelEdit} variant="ghost" size="sm" disabled={saving}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button onClick={saveEdit} size="sm" disabled={saving}>
              <Check className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <GlassCard>
            {editing ? (
              <div className="space-y-4">
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">
                      Priority
                    </label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">Type</label>
                    <Select value={taskType} onValueChange={setTaskType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">
                      Category
                    </label>
                    <Select value={category || "none"} onValueChange={(v) => setCategory(v === "none" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {TASK_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{task.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
                  <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                  {task.task_type && (
                    <Badge variant={typeVariant(task.task_type)}>{task.task_type}</Badge>
                  )}
                  {task.category && (
                    <Badge variant="secondary">
                      <Tag className="mr-1 h-3 w-3" />
                      {categoryLabel(task.category)}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Details info grid (read mode only) */}
          {!editing && (
            <GlassCard>
              <h3 className="mb-4 text-sm font-semibold text-text-primary">Task Details</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: User,
                    color: "text-accent-primary",
                    label: "Assignee",
                    val: task.users ? (
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bg-elevated text-[10px] font-bold text-text-secondary">
                          {task.users.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                        {task.users.full_name}
                      </span>
                    ) : (
                      "Unassigned"
                    ),
                  },
                  {
                    icon: Calendar,
                    color: "text-signal-warning",
                    label: "Due Date",
                    val: formatDateTime(task.due_date, task.due_time),
                  },
                  {
                    icon: User,
                    color: "text-signal-success",
                    label: "Created By",
                    val: task.creator?.full_name || "\u2014",
                  },
                  {
                    icon: Calendar,
                    color: "text-signal-info",
                    label: "Start Date",
                    val: formatDate(task.start_date),
                  },
                  {
                    icon: Calendar,
                    color: "text-accent-cyan",
                    label: "End Date",
                    val: formatDate(task.end_date),
                  },
                  {
                    icon: Clock,
                    color: "text-accent-primary",
                    label: "Estimated",
                    val:
                      task.estimated_minutes != null
                        ? `${task.estimated_minutes} minutes`
                        : "\u2014",
                  },
                  {
                    icon: Clock,
                    color: "text-text-tertiary",
                    label: "Created",
                    val: formatRelativeTime(task.created_at),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-lg bg-bg-elevated/30 px-4 py-3"
                  >
                    <item.icon className={`h-4 w-4 ${item.color} shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-text-tertiary">
                        {item.label}
                      </p>
                      <div className="text-sm font-medium text-text-primary truncate">
                        {item.val}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Edit fields (edit mode only) */}
          {editing && (
            <GlassCard>
              <h3 className="mb-4 text-sm font-semibold text-text-primary">Task Fields</h3>
              <div className="space-y-4">
                {/* Assignee */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Assignee</label>
                  <Select
                    value={assigneeId || "none"}
                    onValueChange={(v) => setAssigneeId(v === "none" ? "" : v)}
                    disabled={loadingOptions}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingOptions ? "Loading..." : "Select assignee"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Deal + Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">Deal</label>
                    <Select
                      value={dealId || "none"}
                      onValueChange={(v) => setDealId(v === "none" ? "" : v)}
                      disabled={loadingOptions}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingOptions ? "Loading..." : "Select deal"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No deal</SelectItem>
                        {deals.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">Contact</label>
                    <Select
                      value={contactId || "none"}
                      onValueChange={(v) => setContactId(v === "none" ? "" : v)}
                      disabled={loadingOptions}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={loadingOptions ? "Loading..." : "Select contact"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No contact</SelectItem>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.first_name} {c.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Due Date + Due Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Due Date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <Input
                    label="Due Time"
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                  />
                </div>

                {/* Start Date + End Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* Category + Estimated Minutes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">
                      Category
                    </label>
                    <Select value={category || "none"} onValueChange={(v) => setCategory(v === "none" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {TASK_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    label="Estimated Minutes"
                    type="number"
                    min={0}
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    placeholder="e.g. 30"
                  />
                </div>

                {/* Notes / Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Description / Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={8}
                    className="glass-panel-dense focus-ring w-full rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary resize-y min-h-[180px]"
                    placeholder="Detailed task description, requirements, context, and specifications..."
                  />
                </div>
              </div>
            </GlassCard>
          )}

          {/* Description / Notes card (read mode, only when notes exist) */}
          {!editing && task.notes && (
            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-accent-primary" />
                <h3 className="text-sm font-semibold text-text-primary">Description / Notes</h3>
              </div>
              <div className="rounded-lg bg-bg-elevated/30 px-4 py-3">
                <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{task.notes}</p>
              </div>
            </GlassCard>
          )}
        </div>

        {/* ── Sidebar column ──────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Linked Deal */}
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Linked Deal</h3>
            {task.deals ? (
              <Link
                href={`/deals/${task.deals.id}`}
                className="flex items-center gap-3 rounded-lg bg-bg-elevated/30 px-4 py-3 transition-colors hover:bg-bg-elevated/50"
              >
                <Briefcase className="h-4 w-4 text-accent-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {task.deals.title}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formatCurrency(task.deals.value)}
                  </p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-text-tertiary">No deal linked</p>
            )}
          </GlassCard>

          {/* Linked Contact */}
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Linked Contact</h3>
            {task.contacts ? (
              <Link
                href={`/contacts/${task.contacts.id}`}
                className="flex items-center gap-3 rounded-lg bg-bg-elevated/30 px-4 py-3 transition-colors hover:bg-bg-elevated/50"
              >
                <User className="h-4 w-4 text-signal-success shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {task.contacts.first_name} {task.contacts.last_name}
                  </p>
                  {task.contacts.email && (
                    <p className="text-xs text-text-secondary truncate">{task.contacts.email}</p>
                  )}
                </div>
              </Link>
            ) : (
              <p className="text-sm text-text-tertiary">No contact linked</p>
            )}
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                onClick={toggleStatus}
                variant="secondary"
                size="sm"
                className="w-full justify-center"
              >
                {task.status === "Done" ? (
                  <>
                    <Circle className="h-3.5 w-3.5" />
                    Reopen Task
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark as Done
                  </>
                )}
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
                size="sm"
                className="w-full justify-center"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Task
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
