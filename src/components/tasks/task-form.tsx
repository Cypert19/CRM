"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createTask,
  updateTask,
  deleteTask,
  type TaskWithRelations,
} from "@/actions/tasks";
import { getWorkspaceMembers } from "@/actions/workspace";
import { getDeals } from "@/actions/deals";
import { getContacts } from "@/actions/contacts";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_TYPES,
  TASK_CATEGORIES,
} from "@/lib/constants";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

type TaskFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId?: string;
  contactId?: string;
  task?: TaskWithRelations;
};

const CATEGORY_LABELS: Record<string, string> = {
  deal: "Deal",
  personal: "Personal",
  workshop: "Workshop",
  other: "Other",
};

const NONE_VALUE = "__none__";

function getDefaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

function getInitialState(task?: TaskWithRelations, dealId?: string, contactId?: string) {
  return {
    title: task?.title ?? "",
    status: task?.status ?? "To Do",
    priority: task?.priority ?? "Medium",
    task_type: task?.task_type ?? "Other",
    assignee_id: task?.assignee_id ?? NONE_VALUE,
    deal_id: task?.deal_id ?? dealId ?? NONE_VALUE,
    contact_id: task?.contact_id ?? contactId ?? NONE_VALUE,
    due_date: task?.due_date ?? (task ? "" : getDefaultDueDate()),
    due_time: task?.due_time ?? "",
    start_date: task?.start_date ?? "",
    end_date: task?.end_date ?? "",
    category: task?.category ?? NONE_VALUE,
    estimated_minutes: task?.estimated_minutes ?? "",
    notes: task?.notes ?? "",
  };
}

export function TaskForm({ open, onOpenChange, dealId, contactId, task }: TaskFormProps) {
  const router = useRouter();
  const isEditMode = !!task;

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [form, setForm] = useState(() => getInitialState(task, dealId, contactId));

  // Lookup data
  const [members, setMembers] = useState<
    (Tables<"workspace_members"> & { users: Tables<"users"> })[]
  >([]);
  const [deals, setDeals] = useState<Tables<"deals">[]>([]);
  const [contacts, setContacts] = useState<Tables<"contacts">[]>([]);
  const [lookupLoaded, setLookupLoaded] = useState(false);

  // Reset form when dialog opens or task changes
  useEffect(() => {
    if (open) {
      setForm(getInitialState(task, dealId, contactId));
    }
  }, [open, task, dealId, contactId]);

  // Lazy-load lookup data when dialog opens
  useEffect(() => {
    if (!open) return;
    if (lookupLoaded) return;

    let cancelled = false;

    async function loadLookups() {
      const [membersRes, dealsRes, contactsRes] = await Promise.all([
        getWorkspaceMembers(),
        getDeals(),
        getContacts(),
      ]);

      if (cancelled) return;

      if (membersRes.success && membersRes.data) setMembers(membersRes.data);
      if (dealsRes.success && dealsRes.data) setDeals(dealsRes.data);
      if (contactsRes.success && contactsRes.data) setContacts(contactsRes.data);
      setLookupLoaded(true);
    }

    loadLookups();

    return () => {
      cancelled = true;
    };
  }, [open, lookupLoaded]);

  function updateField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resolveNone(val: string): string | null {
    return val === NONE_VALUE || val === "" ? null : val;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const payload: Record<string, unknown> = {
      title: form.title,
      status: form.status,
      priority: form.priority,
      task_type: form.task_type,
      assignee_id: resolveNone(form.assignee_id),
      deal_id: resolveNone(form.deal_id),
      contact_id: resolveNone(form.contact_id),
      due_date: form.due_date || null,
      due_time: form.due_time || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      category: resolveNone(form.category),
      estimated_minutes:
        form.estimated_minutes !== "" ? Number(form.estimated_minutes) : null,
      notes: form.notes || null,
    };

    let result;
    if (isEditMode) {
      result = await updateTask({ id: task.id, ...payload });
    } else {
      result = await createTask(payload);
    }

    setLoading(false);

    if (result.success) {
      toast.success(isEditMode ? "Task updated" : "Task created");
      if (!isEditMode) {
        setForm(getInitialState(undefined, dealId, contactId));
      }
      onOpenChange(false);
    } else {
      toast.error(result.error || "Something went wrong");
    }
  }

  async function handleDelete() {
    if (!task) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this task? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(true);
    const result = await deleteTask(task.id);
    setDeleting(false);

    if (result.success) {
      toast.success("Task deleted");
      onOpenChange(false);
      router.push("/tasks");
    } else {
      toast.error(result.error || "Failed to delete task");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
                autoFocus
                placeholder="Task title"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Status</label>
              <Select
                value={form.status}
                onValueChange={(val) => updateField("status", val)}
              >
                <SelectTrigger>
                  <SelectValue />
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
          </div>

          {/* Priority + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Priority</label>
              <Select
                value={form.priority}
                onValueChange={(val) => updateField("priority", val)}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <label className="block text-xs text-text-secondary">Type</label>
              <Select
                value={form.task_type}
                onValueChange={(val) => updateField("task_type", val)}
              >
                <SelectTrigger>
                  <SelectValue />
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
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <label className="block text-xs text-text-secondary">Assignee</label>
            <Select
              value={form.assignee_id}
              onValueChange={(val) => updateField("assignee_id", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.users?.full_name || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deal + Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Deal</label>
              <Select
                value={form.deal_id}
                onValueChange={(val) => updateField("deal_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {deals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Contact</label>
              <Select
                value={form.contact_id}
                onValueChange={(val) => updateField("contact_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Due Date</label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => updateField("due_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Due Time</label>
              <Input
                type="time"
                value={form.due_time}
                onChange={(e) => updateField("due_time", e.target.value)}
              />
            </div>
          </div>

          {/* Start Date + End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Start Date</label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => updateField("start_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">End Date</label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => updateField("end_date", e.target.value)}
              />
            </div>
          </div>

          {/* Category + Estimated Minutes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Category</label>
              <Select
                value={form.category}
                onValueChange={(val) => updateField("category", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {TASK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c] || c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">
                Estimated Minutes
              </label>
              <Input
                type="number"
                min={0}
                value={form.estimated_minutes}
                onChange={(e) =>
                  updateField(
                    "estimated_minutes",
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="e.g. 30"
              />
            </div>
          </div>

          {/* Notes / Description */}
          <div className="space-y-1.5">
            <label className="block text-xs text-text-secondary">Description / Notes</label>
            <textarea
              className="glass-panel-dense focus-ring w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary resize-y min-h-[120px]"
              rows={6}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Detailed task description, requirements, context, and specifications..."
            />
          </div>

          {/* Footer */}
          <DialogFooter className="flex items-center gap-2">
            {isEditMode && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="mr-auto"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
