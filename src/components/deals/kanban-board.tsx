"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { moveDealStage } from "@/actions/deals";
import type { Tables } from "@/types/database";

type DealWithRelations = Tables<"deals"> & {
  contacts?: { id: string; first_name: string; last_name: string } | null;
  users?: { id: string; full_name: string; avatar_url: string | null } | null;
};

type KanbanBoardProps = {
  stages: Tables<"pipeline_stages">[];
  deals: DealWithRelations[];
  onDealClick: (deal: DealWithRelations) => void;
  onAddDeal: (stageId: string) => void;
};

export function KanbanBoard({ stages, deals, onDealClick, onAddDeal }: KanbanBoardProps) {
  const [activeDeal, setActiveDeal] = useState<DealWithRelations | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const getDealsByStage = useCallback(
    (stageId: string) => deals.filter((d) => d.stage_id === stageId),
    [deals]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDeal(null);

    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const newStageId = over.id as string;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === newStageId) return;

    // Check if dropping on a stage (column)
    const isStage = stages.some((s) => s.id === newStageId);
    if (!isStage) return;

    await moveDealStage({ id: dealId, stage_id: newStageId });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages
          .filter((s) => !s.is_lost)
          .sort((a, b) => a.display_order - b.display_order)
          .map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={getDealsByStage(stage.id)}
              onDealClick={onDealClick}
              onAddDeal={onAddDeal}
            />
          ))}
      </div>

      <DragOverlay>
        {activeDeal && (
          <div className="w-[280px] rotate-3">
            <KanbanCard deal={activeDeal} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
