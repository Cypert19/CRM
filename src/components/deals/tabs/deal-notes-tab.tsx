"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Plus, Pin } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/gradient-button";
import { NoteForm } from "@/components/notes/note-form";
import { getNotes } from "@/actions/notes";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

type Note = Tables<"notes">;

export function DealNotesTab({ dealId }: { dealId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const fetchNotes = useCallback(async () => {
    const result = await getNotes("deal", dealId);
    if (result.success && result.data) {
      setNotes(result.data);
    } else {
      toast.error(result.error || "Failed to load notes");
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

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
          Notes ({notes.length})
        </h3>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="mb-3 h-10 w-10 text-text-tertiary" />
            <p className="text-sm font-medium text-text-secondary">No notes yet</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Add notes to capture important details about this deal.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <GlassCard key={note.id} hover className="!p-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium text-text-primary truncate">
                  {note.title || "Untitled"}
                </h4>
                {note.is_pinned && (
                  <Pin className="h-3.5 w-3.5 shrink-0 text-accent-primary" />
                )}
              </div>
              {note.plain_text && (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-text-secondary">
                  {note.plain_text}
                </p>
              )}
              <p className="mt-3 text-[10px] text-text-tertiary">
                {formatRelativeTime(note.created_at)}
              </p>
            </GlassCard>
          ))}
        </div>
      )}

      <NoteForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) fetchNotes();
        }}
        dealId={dealId}
      />
    </div>
  );
}
