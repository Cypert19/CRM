"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KanbanSquare, Table2, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/gradient-button";
import { EmptyState } from "@/components/ui/empty-state";
import { KanbanBoard } from "./kanban-board";
import { DealForm } from "./deal-form";
import { DealTable } from "./deal-table";
import { useUIStore } from "@/stores/ui-store";
import { Target } from "lucide-react";
import type { Tables } from "@/types/database";

type DealsViewProps = {
  deals: Tables<"deals">[];
  stages: Tables<"pipeline_stages">[];
  pipelineId: string;
};

export function DealsView({ deals, stages, pipelineId }: DealsViewProps) {
  const router = useRouter();
  const { dealsViewMode, setDealsViewMode } = useUIStore();
  const [formOpen, setFormOpen] = useState(false);
  const [defaultStageId, setDefaultStageId] = useState<string | undefined>();

  const handleDealClick = (deal: Tables<"deals">) => {
    router.push(`/deals/${deal.id}`);
  };

  const handleAddDeal = (stageId: string) => {
    setDefaultStageId(stageId);
    setFormOpen(true);
  };

  if (deals.length === 0 && stages.length === 0) {
    return (
      <>
        <EmptyState
          icon={Target}
          title="No deals yet"
          description="Create your first deal to start building your pipeline."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Deal
            </Button>
          }
        />
        <DealForm
          open={formOpen}
          onOpenChange={setFormOpen}
          stages={stages}
          pipelineId={pipelineId}
          defaultStageId={defaultStageId}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Deals" description="Manage your sales pipeline">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-bg-card/50 p-0.5">
            <button
              onClick={() => setDealsViewMode("kanban")}
              className={`focus-ring rounded-md px-2.5 py-1.5 text-xs ${dealsViewMode === "kanban" ? "bg-bg-elevated text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
            >
              <KanbanSquare className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDealsViewMode("table")}
              className={`focus-ring rounded-md px-2.5 py-1.5 text-xs ${dealsViewMode === "table" ? "bg-bg-elevated text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
            >
              <Table2 className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => { setDefaultStageId(undefined); setFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>
      </PageHeader>

      <div className="mt-6">
        {dealsViewMode === "kanban" ? (
          <KanbanBoard
            stages={stages}
            deals={deals}
            onDealClick={handleDealClick}
            onAddDeal={handleAddDeal}
          />
        ) : (
          <DealTable deals={deals} onDealClick={handleDealClick} />
        )}
      </div>

      <DealForm
        open={formOpen}
        onOpenChange={setFormOpen}
        stages={stages}
        pipelineId={pipelineId}
        defaultStageId={defaultStageId}
      />
    </>
  );
}
