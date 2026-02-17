"use client";

import { useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { DashboardTileWrapper } from "./dashboard-tile-wrapper";
import type { DashboardTile } from "@/types/dashboard";

type Props = {
  tiles: DashboardTile[];
  editMode: boolean;
  onReorder: (tiles: DashboardTile[]) => void;
  onEditTile: (tile: DashboardTile) => void;
  onDeleteTile: (tileId: string) => void;
};

export function DashboardGrid({ tiles, editMode, onReorder, onEditTile, onDeleteTile }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = tiles.findIndex((t) => t.id === active.id);
      const newIndex = tiles.findIndex((t) => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...tiles];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      // Update display_order
      const updated = reordered.map((t, i) => ({ ...t, display_order: i }));
      onReorder(updated);
    },
    [tiles, onReorder]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tiles.map((t) => t.id)} strategy={rectSortingStrategy}>
        <div className="grid auto-rows-auto grid-cols-2 gap-4 sm:grid-cols-6 lg:grid-cols-12">
          {tiles.map((tile) => (
            <DashboardTileWrapper
              key={tile.id}
              tile={tile}
              editMode={editMode}
              onEdit={onEditTile}
              onDelete={onDeleteTile}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {/* Simple visual feedback during drag */}
        <div className="glass-panel rounded-2xl p-6 opacity-80 shadow-lg" />
      </DragOverlay>
    </DndContext>
  );
}
