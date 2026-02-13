"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  X,
  Check,
  Trash2,
  LayoutGrid,
  CheckSquare,
  Calendar,
  FileText,
  BookOpen,
  DollarSign,
  MessageSquareText,
} from "lucide-react";
import { Button } from "@/components/ui/gradient-button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DealOverviewTab } from "./tabs/deal-overview-tab";
import { DealTasksTab } from "./tabs/deal-tasks-tab";
import { DealNotesTab } from "./tabs/deal-notes-tab";
import { DealFilesTab } from "./tabs/deal-files-tab";
import { DealCalendarTab } from "./tabs/deal-calendar-tab";
import { DealRevenueTab } from "./tabs/deal-revenue-tab";
import { DealTranscriptsTab } from "./tabs/deal-transcripts-tab";
import { deleteDeal } from "@/actions/deals";
import { useWorkspace } from "@/hooks/use-workspace";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

type DealWithRelations = Tables<"deals"> & {
  contacts?: { id: string; first_name: string; last_name: string; email: string | null } | null;
  companies?: { id: string; company_name: string } | null;
  users?: { id: string; full_name: string; avatar_url: string | null } | null;
  pipeline_stages?: { id: string; name: string; color: string; is_won: boolean; is_lost: boolean } | null;
  _counts?: {
    tasks: number;
    notes: number;
    files: number;
    events: number;
    deal_contacts: number;
    revenue_items: number;
    transcripts: number;
  };
};

type PipelineWithStages = Tables<"pipelines"> & { pipeline_stages: Tables<"pipeline_stages">[] };

type DealDetailProps = {
  deal: DealWithRelations;
  pipelineStages?: Tables<"pipeline_stages">[];
  allPipelines?: PipelineWithStages[];
};

export function DealDetail({ deal: initialDeal, pipelineStages = [], allPipelines = [] }: DealDetailProps) {
  const router = useRouter();
  const { role } = useWorkspace();
  const { userId } = useUser();
  const [deal, setDeal] = useState(initialDeal);
  const [editing, setEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const counts = deal._counts || { tasks: 0, notes: 0, files: 0, events: 0, deal_contacts: 0, revenue_items: 0, transcripts: 0 };

  const canDelete = role === "Admin" || userId === deal.owner_id;

  const handleDelete = async () => {
    const result = await deleteDeal(deal.id);
    if (result.success) {
      toast.success("Deal deleted successfully");
      router.push("/deals");
    } else {
      toast.error(result.error || "Failed to delete deal");
    }
  };

  const handleDealUpdate = useCallback((updatedDeal: DealWithRelations) => {
    setDeal((prev) => ({ ...prev, ...updatedDeal }));
    setEditing(false);
  }, []);

  const startEdit = () => {
    // Reset the overview tab's edit state
    const w = window as unknown as Record<string, unknown>;
    if (typeof window !== "undefined" && w.__dealOverviewReset) {
      (w.__dealOverviewReset as () => void)();
    }
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    const w = window as unknown as Record<string, unknown>;
    if (typeof window !== "undefined" && w.__dealOverviewSave) {
      await (w.__dealOverviewSave as () => Promise<void>)();
    }
  };

  const saving = typeof window !== "undefined"
    ? ((window as unknown as Record<string, unknown>).__dealOverviewSaving as boolean) || false
    : false;

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Link>
        {!editing ? (
          <div className="flex items-center gap-2">
            {canDelete && (
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="ghost"
                size="sm"
                className="text-signal-danger hover:bg-signal-danger/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
            <Button onClick={startEdit} variant="secondary" size="sm">
              <Pencil className="h-3.5 w-3.5" />
              Edit Deal
            </Button>
          </div>
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

      {/* Tabbed Layout */}
      <div className="mt-4">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5">
              <CheckSquare className="h-3.5 w-3.5" />
              Tasks
              {counts.tasks > 0 && (
                <span className="ml-1 rounded-full bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">
                  {counts.tasks}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Calendar
              {counts.events > 0 && (
                <span className="ml-1 rounded-full bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">
                  {counts.events}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Revenue
              {counts.revenue_items > 0 && (
                <span className="ml-1 rounded-full bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">
                  {counts.revenue_items}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="transcripts" className="gap-1.5">
              <MessageSquareText className="h-3.5 w-3.5" />
              Meeting Notes
              {counts.transcripts > 0 && (
                <span className="ml-1 rounded-full bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">
                  {counts.transcripts}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Notes
              {counts.notes > 0 && (
                <span className="ml-1 rounded-full bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">
                  {counts.notes}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Knowledge Base
              {counts.files > 0 && (
                <span className="ml-1 rounded-full bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">
                  {counts.files}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DealOverviewTab
              deal={deal}
              editing={editing}
              onDealUpdate={handleDealUpdate}
              pipelineStages={pipelineStages}
              allPipelines={allPipelines}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <DealTasksTab dealId={deal.id} />
          </TabsContent>

          <TabsContent value="calendar">
            <DealCalendarTab dealId={deal.id} />
          </TabsContent>

          <TabsContent value="revenue">
            <DealRevenueTab dealId={deal.id} currency={deal.currency} />
          </TabsContent>

          <TabsContent value="transcripts">
            <DealTranscriptsTab dealId={deal.id} dealTitle={deal.title} />
          </TabsContent>

          <TabsContent value="notes">
            <DealNotesTab dealId={deal.id} />
          </TabsContent>

          <TabsContent value="files">
            <DealFilesTab dealId={deal.id} />
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Deal"
        description="Are you sure you want to delete this deal? Associated tasks, notes, and files will remain but will no longer be linked."
        entityName={deal.title}
        onConfirm={handleDelete}
      />
    </div>
  );
}
