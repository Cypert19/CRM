"use client";

import { useRouter } from "next/navigation";
import { Plus, FileText, Pin } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import type { Tables } from "@/types/database";

export function NotesList({ notes }: { notes: Tables<"notes">[] }) {
  const router = useRouter();

  if (notes.length === 0) {
    return (
      <EmptyState icon={FileText} title="No notes yet" description="Create your first note." action={<Button onClick={() => router.push("/notes/new")}><Plus className="h-4 w-4" />New Note</Button>} />
    );
  }

  return (
    <>
      <PageHeader title="Notes" description="Capture and organize your thoughts">
        <Button onClick={() => router.push("/notes/new")}><Plus className="h-4 w-4" />New Note</Button>
      </PageHeader>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <GlassCard key={note.id} hover onClick={() => router.push(`/notes/${note.id}`)} className="cursor-pointer">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-text-primary line-clamp-1">{note.title || "Untitled Note"}</h3>
              {note.is_pinned && <Pin className="h-3.5 w-3.5 text-accent-primary" />}
            </div>
            <p className="mt-2 text-xs text-text-secondary line-clamp-3">{note.plain_text || "Empty note"}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-text-tertiary">{formatRelativeTime(note.created_at)}</span>
              {note.ai_summary && <Badge variant="cyan">AI Summary</Badge>}
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
