"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquareText,
  Plus,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Trash2,
  Check,
  Clock,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { DraftTaskCard } from "./draft-task-card";
import { getTranscripts, createTranscript, updateTranscript, deleteTranscript } from "@/actions/transcripts";
import { createTask } from "@/actions/tasks";
import { toast } from "sonner";
import type { TranscriptWithCreator, DraftTask } from "@/types/transcript";

type WorkspaceMember = {
  user_id: string;
  users: { id: string; full_name: string; avatar_url: string | null };
};

type Props = {
  dealId: string;
  dealTitle?: string;
};

export function DealTranscriptsTab({ dealId, dealTitle }: Props) {
  const [transcripts, setTranscripts] = useState<TranscriptWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formText, setFormText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  const fetchTranscripts = useCallback(async () => {
    const result = await getTranscripts(dealId);
    if (result.success && result.data) {
      setTranscripts(result.data);
    } else {
      toast.error(result.error || "Failed to load transcripts");
    }
    setLoading(false);
  }, [dealId]);

  // Lazy-load workspace members for assignee picker
  const fetchMembers = useCallback(async () => {
    try {
      const { getWorkspaceMembers } = await import("@/actions/workspace");
      const res = await getWorkspaceMembers();
      if (res.success && res.data) {
        setMembers(res.data as unknown as WorkspaceMember[]);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchTranscripts();
    fetchMembers();
  }, [fetchTranscripts, fetchMembers]);

  const handleSubmit = async () => {
    // Capture text before any state changes — formText will be cleared below
    const transcriptText = formText.trim();

    if (!transcriptText || transcriptText.length < 10) {
      toast.error("Please paste a transcript (at least 10 characters)");
      return;
    }

    setSubmitting(true);
    const title = formTitle.trim() || `Meeting Notes - ${new Date().toLocaleDateString()}`;

    // 1. Create the transcript record
    const createResult = await createTranscript({
      deal_id: dealId,
      title,
      transcript_text: transcriptText,
    });

    if (!createResult.success || !createResult.data) {
      toast.error(createResult.error || "Failed to save transcript");
      setSubmitting(false);
      return;
    }

    const transcriptId = createResult.data.id;
    toast.success("Transcript saved! Extracting tasks...");

    // Reset form (safe — transcriptText is captured in local variable)
    setFormTitle("");
    setFormText("");
    setShowForm(false);

    // Re-fetch to show the new transcript
    await fetchTranscripts();

    // 2. Process with AI
    setProcessingId(transcriptId);
    setExpandedId(transcriptId);

    // Mark as processing
    await updateTranscript({ id: transcriptId, status: "processing" });

    try {
      const res = await fetch("/api/ai/extract-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptText, dealTitle }),
      });

      if (!res.ok) {
        throw new Error("AI extraction failed");
      }

      const data = await res.json();

      // Save extracted tasks to the transcript record
      await updateTranscript({
        id: transcriptId,
        ai_extracted_tasks: data.tasks,
        status: "completed",
      });

      // Update local state
      setTranscripts((prev) =>
        prev.map((t) =>
          t.id === transcriptId
            ? { ...t, ai_extracted_tasks: data.tasks, status: "completed" as const }
            : t
        )
      );

      toast.success(`Extracted ${data.tasks.length} tasks from transcript`);
    } catch (err) {
      console.error("AI extraction error:", err);
      await updateTranscript({ id: transcriptId, status: "failed" });
      setTranscripts((prev) =>
        prev.map((t) =>
          t.id === transcriptId ? { ...t, status: "failed" as const } : t
        )
      );
      toast.error("Failed to extract tasks. You can retry later.");
    }

    setProcessingId(null);
    setSubmitting(false);
  };

  const handleRetryExtraction = async (transcript: TranscriptWithCreator) => {
    setProcessingId(transcript.id);
    setExpandedId(transcript.id);

    await updateTranscript({ id: transcript.id, status: "processing" });
    setTranscripts((prev) =>
      prev.map((t) => (t.id === transcript.id ? { ...t, status: "processing" as const } : t))
    );

    try {
      const res = await fetch("/api/ai/extract-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.transcript_text, dealTitle }),
      });

      if (!res.ok) throw new Error("AI extraction failed");

      const data = await res.json();

      await updateTranscript({
        id: transcript.id,
        ai_extracted_tasks: data.tasks,
        status: "completed",
      });

      setTranscripts((prev) =>
        prev.map((t) =>
          t.id === transcript.id
            ? { ...t, ai_extracted_tasks: data.tasks, status: "completed" as const }
            : t
        )
      );

      toast.success(`Extracted ${data.tasks.length} tasks`);
    } catch {
      await updateTranscript({ id: transcript.id, status: "failed" });
      setTranscripts((prev) =>
        prev.map((t) => (t.id === transcript.id ? { ...t, status: "failed" as const } : t))
      );
      toast.error("Failed to extract tasks");
    }

    setProcessingId(null);
  };

  const handleConfirmTask = async (transcript: TranscriptWithCreator, draftTask: DraftTask) => {
    // Create real CRM task
    const result = await createTask({
      title: draftTask.title,
      task_type: draftTask.task_type,
      priority: draftTask.priority,
      due_date: draftTask.due_date,
      notes: draftTask.notes,
      assignee_id: draftTask.assignee_id,
      deal_id: dealId,
      status: "To Do",
      category: "deal",
    });

    if (!result.success) {
      toast.error(result.error || "Failed to create task");
      return;
    }

    // Mark as confirmed in local state and persist
    const updatedTasks = transcript.ai_extracted_tasks.map((t) =>
      t.id === draftTask.id ? { ...t, ...draftTask, confirmed: true } : t
    );

    setTranscripts((prev) =>
      prev.map((tr) =>
        tr.id === transcript.id ? { ...tr, ai_extracted_tasks: updatedTasks } : tr
      )
    );

    // Persist to database
    await updateTranscript({
      id: transcript.id,
      ai_extracted_tasks: updatedTasks,
    });

    toast.success(`Task "${draftTask.title}" created`);
  };

  const handleConfirmAll = async (transcript: TranscriptWithCreator) => {
    const unconfirmed = transcript.ai_extracted_tasks.filter((t) => !t.confirmed);
    if (unconfirmed.length === 0) return;

    let successCount = 0;

    for (const draftTask of unconfirmed) {
      const result = await createTask({
        title: draftTask.title,
        task_type: draftTask.task_type,
        priority: draftTask.priority,
        due_date: draftTask.due_date,
        notes: draftTask.notes,
        assignee_id: draftTask.assignee_id,
        deal_id: dealId,
        status: "To Do",
        category: "deal",
      });

      if (result.success) {
        successCount++;
      }
    }

    // Mark all as confirmed
    const updatedTasks = transcript.ai_extracted_tasks.map((t) => ({
      ...t,
      confirmed: true,
    }));

    setTranscripts((prev) =>
      prev.map((tr) =>
        tr.id === transcript.id ? { ...tr, ai_extracted_tasks: updatedTasks } : tr
      )
    );

    await updateTranscript({
      id: transcript.id,
      ai_extracted_tasks: updatedTasks,
    });

    toast.success(`Created ${successCount} tasks`);
  };

  const handleUpdateDraft = (transcript: TranscriptWithCreator, updatedTask: DraftTask) => {
    const updatedTasks = transcript.ai_extracted_tasks.map((t) =>
      t.id === updatedTask.id ? updatedTask : t
    );

    setTranscripts((prev) =>
      prev.map((tr) =>
        tr.id === transcript.id ? { ...tr, ai_extracted_tasks: updatedTasks } : tr
      )
    );

    // Persist changes
    updateTranscript({
      id: transcript.id,
      ai_extracted_tasks: updatedTasks,
    });
  };

  const handleDelete = async (transcript: TranscriptWithCreator) => {
    const result = await deleteTranscript({ id: transcript.id });
    if (result.success) {
      setTranscripts((prev) => prev.filter((t) => t.id !== transcript.id));
      toast.success("Transcript deleted");
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Processed</Badge>;
      case "processing":
        return <Badge variant="info">Processing...</Badge>;
      case "failed":
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Meeting Notes ({transcripts.length})
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Transcript
        </Button>
      </div>

      {/* New Transcript Form */}
      {showForm && (
        <GlassCard glow="violet">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-primary" />
              <h4 className="text-sm font-semibold text-text-primary">Paste Meeting Transcript</h4>
            </div>
            <Input
              label="Title (optional)"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={`Meeting Notes - ${new Date().toLocaleDateString()}`}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">
                Meeting Transcript
              </label>
              <textarea
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder="Paste your meeting transcript here. AI will automatically detect tasks, follow-ups, and action items..."
                rows={8}
                className="glass-panel-dense focus-ring w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary resize-y"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-text-tertiary">
                AI will extract tasks automatically after saving.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={submitting || formText.trim().length < 10}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      Save & Extract Tasks
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Empty State */}
      {transcripts.length === 0 && !showForm && (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageSquareText className="mb-3 h-10 w-10 text-text-tertiary" />
            <p className="text-sm font-medium text-text-secondary">No meeting notes yet</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Paste a meeting transcript and AI will automatically extract tasks and action items.
            </p>
          </div>
        </GlassCard>
      )}

      {/* Transcript List */}
      {transcripts.map((transcript) => {
        const isExpanded = expandedId === transcript.id;
        const isProcessing = processingId === transcript.id;
        const unconfirmedCount = transcript.ai_extracted_tasks.filter((t) => !t.confirmed).length;
        const totalTasks = transcript.ai_extracted_tasks.length;

        return (
          <div key={transcript.id} className="space-y-3">
            {/* Transcript Header */}
            <GlassCard className="!p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : transcript.id)}
                  className="mt-0.5 shrink-0 text-text-tertiary transition-colors hover:text-text-primary"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-text-primary truncate">
                      {transcript.title}
                    </h4>
                    {statusBadge(transcript.status)}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(transcript.created_at).toLocaleDateString()}
                    </span>
                    {transcript.creator && (
                      <span>by {transcript.creator.full_name}</span>
                    )}
                    {totalTasks > 0 && (
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        {totalTasks - unconfirmedCount}/{totalTasks} tasks created
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {transcript.status === "failed" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRetryExtraction(transcript)}
                      disabled={isProcessing}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Retry
                    </Button>
                  )}
                  {unconfirmedCount > 0 && transcript.status === "completed" && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirmAll(transcript)}
                      disabled={isProcessing}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Create All ({unconfirmedCount})
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(transcript)}
                    className="text-signal-danger hover:bg-signal-danger/10 h-8 w-8 p-0"
                    title="Delete transcript"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </GlassCard>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="ml-7 space-y-4">
                {/* Transcript Text (collapsible) */}
                <GlassCard className="!p-4">
                  <details>
                    <summary className="cursor-pointer text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                      View Transcript Text
                    </summary>
                    <p className="mt-3 text-xs text-text-tertiary leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {transcript.transcript_text}
                    </p>
                  </details>
                </GlassCard>

                {/* Processing State */}
                {isProcessing && (
                  <GlassCard className="!p-6">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-accent-primary mb-3" />
                      <p className="text-sm font-medium text-text-primary">Analyzing transcript...</p>
                      <p className="mt-1 text-xs text-text-tertiary">
                        AI is extracting tasks and action items from your meeting notes.
                      </p>
                    </div>
                  </GlassCard>
                )}

                {/* Extracted Tasks */}
                {transcript.status === "completed" && transcript.ai_extracted_tasks.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Extracted Tasks ({transcript.ai_extracted_tasks.length})
                    </h5>
                    {transcript.ai_extracted_tasks.map((task) => (
                      <DraftTaskCard
                        key={task.id}
                        task={task}
                        members={members}
                        onConfirm={(confirmedTask) => handleConfirmTask(transcript, confirmedTask)}
                        onUpdate={(updatedTask) => handleUpdateDraft(transcript, updatedTask)}
                        disabled={isProcessing}
                      />
                    ))}
                  </div>
                )}

                {/* Completed with no tasks */}
                {transcript.status === "completed" && transcript.ai_extracted_tasks.length === 0 && (
                  <GlassCard className="!p-4">
                    <p className="text-xs text-text-tertiary text-center">
                      No actionable tasks were found in this transcript.
                    </p>
                  </GlassCard>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
