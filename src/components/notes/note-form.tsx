"use client";

import { useState } from "react";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createNote } from "@/actions/notes";
import { toast } from "sonner";

export function NoteForm({
  open,
  onOpenChange,
  dealId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const title = (fd.get("title") as string) || null;
    const plainText = (fd.get("plain_text") as string) || "";

    const result = await createNote({
      title,
      plain_text: plainText,
      content: { type: "doc", content: [{ type: "paragraph", content: plainText ? [{ type: "text", text: plainText }] : [] }] },
      is_pinned: false,
    });
    setLoading(false);
    if (result.success) {
      toast.success("Note created");
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to create note");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="title"
            label="Title"
            placeholder="Note title (optional)"
            autoFocus
          />
          <div className="space-y-1.5">
            <label className="block text-xs text-text-secondary">
              Content
            </label>
            <textarea
              name="plain_text"
              rows={5}
              placeholder="Write your note..."
              className="focus-ring glass-panel w-full resize-none rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
