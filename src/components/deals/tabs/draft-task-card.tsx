"use client";

import { useState } from "react";
import { Check, Pencil, X, User, Loader2, FileText } from "lucide-react";
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
import type { DraftTask } from "@/types/transcript";

type WorkspaceMember = {
  user_id: string;
  users: { id: string; full_name: string; avatar_url: string | null };
};

type Props = {
  task: DraftTask;
  members: WorkspaceMember[];
  onConfirm: (task: DraftTask) => Promise<void>;
  onUpdate: (task: DraftTask) => void;
  disabled?: boolean;
};

const TASK_TYPES = ["Call", "Email", "Meeting", "Follow-Up", "Demo", "Proposal", "Automations", "Website Development", "Custom Development", "Training", "Consulting", "Other"] as const;
const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

const priorityVariant = (p: string) => {
  switch (p) {
    case "Urgent": return "danger" as const;
    case "High": return "warning" as const;
    case "Medium": return "info" as const;
    default: return "secondary" as const;
  }
};

const typeVariant = (t: string) => {
  switch (t) {
    case "Call":
    case "Email": return "cyan" as const;
    case "Meeting":
    case "Demo": return "info" as const;
    case "Automations":
    case "Custom Development": return "default" as const;
    case "Website Development": return "default" as const;
    case "Training":
    case "Consulting": return "warning" as const;
    case "Proposal": return "success" as const;
    default: return "secondary" as const;
  }
};

export function DraftTaskCard({ task, members, onConfirm, onUpdate, disabled }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showFullNotes, setShowFullNotes] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editType, setEditType] = useState(task.task_type);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editDueDate, setEditDueDate] = useState(task.due_date || "");
  const [editAssignee, setEditAssignee] = useState(task.assignee_id || "__none__");
  const [editNotes, setEditNotes] = useState(task.notes || "");

  const handleConfirm = async () => {
    setConfirming(true);
    await onConfirm({
      ...task,
      title: editTitle,
      task_type: editType,
      priority: editPriority,
      due_date: editDueDate || null,
      assignee_id: editAssignee === "__none__" ? null : editAssignee,
      notes: editNotes || null,
      confirmed: true,
    });
    setConfirming(false);
  };

  const saveEdit = () => {
    onUpdate({
      ...task,
      title: editTitle,
      task_type: editType,
      priority: editPriority,
      due_date: editDueDate || null,
      assignee_id: editAssignee === "__none__" ? null : editAssignee,
      notes: editNotes || null,
    });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(task.title);
    setEditType(task.task_type);
    setEditPriority(task.priority);
    setEditDueDate(task.due_date || "");
    setEditAssignee(task.assignee_id || "__none__");
    setEditNotes(task.notes || "");
    setEditing(false);
  };

  if (task.confirmed) {
    return (
      <GlassCard className="!p-4 opacity-60">
        <div className="flex items-center gap-3">
          <Check className="h-5 w-5 text-signal-success shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary line-through">{task.title}</p>
            <p className="text-xs text-signal-success mt-0.5">Task created</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (editing) {
    return (
      <GlassCard className="!p-4" glow="violet">
        <div className="space-y-3">
          <Input
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Type</label>
              <Select value={editType} onValueChange={(v) => setEditType(v as typeof editType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Priority</label>
              <Select value={editPriority} onValueChange={(v) => setEditPriority(v as typeof editPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date"
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Assignee</label>
              <Select value={editAssignee} onValueChange={setEditAssignee}>
                <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-text-tertiary">Unassigned</span>
                  </SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.users.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">
              Description / Notes
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Detailed task description, requirements, context..."
              rows={8}
              className="glass-panel-dense focus-ring w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary resize-y min-h-[160px]"
            />
            <p className="text-[10px] text-text-tertiary">
              Include all relevant context, requirements, and specifications so anyone can understand this task.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancelEdit}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={saveEdit}>
              <Check className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Default: display mode
  const assigneeMember = task.assignee_id ? members.find((m) => m.user_id === task.assignee_id) : null;
  const notesPreviewLength = 200;
  const hasLongNotes = task.notes && task.notes.length > notesPreviewLength;

  return (
    <GlassCard className="!p-4" hover>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">{task.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
            <Badge variant={typeVariant(task.task_type)}>{task.task_type}</Badge>
            {task.due_date && (
              <span className="text-xs text-text-tertiary">
                Due {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
            {assigneeMember && (
              <span className="flex items-center gap-1 text-xs text-text-tertiary">
                <User className="h-3 w-3" />
                {assigneeMember.users.full_name}
              </span>
            )}
          </div>
          {task.notes && (
            <div className="mt-2.5 rounded-lg bg-bg-elevated/30 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText className="h-3 w-3 text-text-tertiary" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">Description</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                {showFullNotes || !hasLongNotes
                  ? task.notes
                  : `${task.notes.slice(0, notesPreviewLength)}...`}
              </p>
              {hasLongNotes && (
                <button
                  type="button"
                  onClick={() => setShowFullNotes(!showFullNotes)}
                  className="mt-1.5 text-[11px] font-medium text-accent-primary hover:text-accent-primary/80 transition-colors"
                >
                  {showFullNotes ? "Show less" : "Read full description"}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Edit task"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={disabled || confirming}
            className="h-8"
            title="Create task"
          >
            {confirming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Create
              </>
            )}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
