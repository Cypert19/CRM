"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { TileRenderer } from "./tile-renderer";
import type { DashboardTile } from "@/types/dashboard";

type Props = {
  tile: DashboardTile;
  editMode: boolean;
  onEdit: (tile: DashboardTile) => void;
  onDelete: (tileId: string) => void;
};

export function DashboardTileWrapper({ tile, editMode, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tile.id,
    disabled: !editMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${tile.grid_w}`,
    gridRow: `span ${tile.grid_h}`,
    opacity: isDragging ? 0.5 : 1,
  };

  const heightClass =
    tile.grid_h === 1 ? "min-h-[120px]" :
    tile.grid_h === 2 ? "min-h-[280px]" :
    tile.grid_h === 3 ? "min-h-[440px]" :
    "min-h-[600px]";

  return (
    <div ref={setNodeRef} style={style} className={heightClass}>
      <GlassCard
        className={`relative h-full ${editMode ? "ring-1 ring-border-glass" : ""}`}
        hover={editMode}
      >
        {/* Edit mode overlay controls */}
        {editMode && (
          <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab rounded-md p-1 text-text-tertiary hover:bg-bg-elevated/50 hover:text-text-primary active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(tile)}
              className="rounded-md p-1 text-text-tertiary hover:bg-bg-elevated/50 hover:text-text-primary"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(tile.id)}
              className="rounded-md p-1 text-text-tertiary hover:bg-bg-elevated/50 hover:text-signal-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <TileRenderer tile={tile} />
      </GlassCard>
    </div>
  );
}
