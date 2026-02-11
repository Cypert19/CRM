"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn, formatCompactNumber } from "@/lib/utils";
import { KanbanCard } from "./kanban-card";
import type { Tables } from "@/types/database";

type DealWithRelations = Tables<"deals"> & {
  contacts?: { id: string; first_name: string; last_name: string } | null;
  users?: { id: string; full_name: string; avatar_url: string | null } | null;
};

type KanbanColumnProps = {
  stage: Tables<"pipeline_stages">;
  deals: DealWithRelations[];
  onDealClick: (deal: DealWithRelations) => void;
  onAddDeal: (stageId: string) => void;
};

export function KanbanColumn({ stage, deals, onDealClick, onAddDeal }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });

  const totalValue = deals.reduce((sum, d) => sum + Number(d.value), 0);

  return (
    <div className="flex w-[300px] shrink-0 flex-col">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="text-sm font-semibold text-text-primary">
            {stage.name}
          </h3>
          <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-text-tertiary">
            {deals.length}
          </span>
        </div>
        <span className="font-mono text-xs text-text-tertiary">
          {formatCompactNumber(totalValue)}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-3 rounded-2xl border-2 border-transparent p-2 transition-colors duration-200",
          isOver && "border-accent-primary/40 bg-accent-primary/5"
        )}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <KanbanCard key={deal.id} deal={deal} onClick={onDealClick} />
          ))}
        </SortableContext>

        {/* Add Deal Button */}
        <button
          onClick={() => onAddDeal(stage.id)}
          className="focus-ring flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-glass py-3 text-xs text-text-tertiary transition-colors hover:border-accent-primary/40 hover:text-text-secondary"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Deal
        </button>
      </div>
    </div>
  );
}
