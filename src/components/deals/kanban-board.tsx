"use client";

import { useState, useCallback, useRef } from "react";
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

  // ─── Grab-to-Pan Scrolling ──────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const panState = useRef({ isPanning: false, startX: 0, scrollLeftStart: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Don't pan if clicking on a card — let dnd-kit handle it
    const target = e.target as HTMLElement;
    if (target.closest("[data-kanban-card]")) return;

    // Don't pan if clicking on buttons or interactive elements
    if (target.closest("button, a, input, select, textarea")) return;

    const container = containerRef.current;
    if (!container) return;

    panState.current = {
      isPanning: true,
      startX: e.clientX,
      scrollLeftStart: container.scrollLeft,
    };

    container.setPointerCapture(e.pointerId);
    container.style.cursor = "grabbing";
    container.classList.add("select-none");
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!panState.current.isPanning) return;

    const container = containerRef.current;
    if (!container) return;

    const dx = e.clientX - panState.current.startX;
    container.scrollLeft = panState.current.scrollLeftStart - dx;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!panState.current.isPanning) return;

    panState.current.isPanning = false;

    const container = containerRef.current;
    if (!container) return;

    container.releasePointerCapture(e.pointerId);
    container.style.cursor = "";
    container.classList.remove("select-none");
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto pb-4 cursor-grab"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
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
