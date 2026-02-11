"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  X,
  Check,
  LayoutGrid,
  CheckSquare,
  Calendar,
  FileText,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/gradient-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DealOverviewTab } from "./tabs/deal-overview-tab";
import { DealTasksTab } from "./tabs/deal-tasks-tab";
import { DealNotesTab } from "./tabs/deal-notes-tab";
import { DealFilesTab } from "./tabs/deal-files-tab";
import { DealCalendarTab } from "./tabs/deal-calendar-tab";
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
  };
};

type DealDetailProps = {
  deal: DealWithRelations;
};

export function DealDetail({ deal: initialDeal }: DealDetailProps) {
  const [deal, setDeal] = useState(initialDeal);
  const [editing, setEditing] = useState(false);
  const counts = deal._counts || { tasks: 0, notes: 0, files: 0, events: 0, deal_contacts: 0 };

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
          <Button onClick={startEdit} variant="secondary" size="sm">
            <Pencil className="h-3.5 w-3.5" />
            Edit Deal
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
              <FolderOpen className="h-3.5 w-3.5" />
              Files
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
            />
          </TabsContent>

          <TabsContent value="tasks">
            <DealTasksTab dealId={deal.id} />
          </TabsContent>

          <TabsContent value="calendar">
            <DealCalendarTab dealId={deal.id} />
          </TabsContent>

          <TabsContent value="notes">
            <DealNotesTab dealId={deal.id} />
          </TabsContent>

          <TabsContent value="files">
            <DealFilesTab dealId={deal.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
