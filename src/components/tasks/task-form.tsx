"use client";

import { useState } from "react";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createTask } from "@/actions/tasks";
import { TASK_PRIORITIES, TASK_TYPES } from "@/lib/constants";
import { toast } from "sonner";

export function TaskForm({ open, onOpenChange, dealId }: { open: boolean; onOpenChange: (open: boolean) => void; dealId?: string }) {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await createTask({
      title: fd.get("title") as string,
      priority: (fd.get("priority") as string) || "Medium",
      task_type: (fd.get("task_type") as string) || "Other",
      due_date: (fd.get("due_date") as string) || undefined,
      deal_id: dealId || undefined,
    });
    setLoading(false);
    if (result.success) { toast.success("Task created"); onOpenChange(false); }
    else toast.error(result.error || "Failed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="title" label="Task Title" required autoFocus />
          <Input name="due_date" label="Due Date" type="date" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Priority</label>
              <Select name="priority" defaultValue="Medium">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Type</label>
              <Select name="task_type" defaultValue="Other">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
