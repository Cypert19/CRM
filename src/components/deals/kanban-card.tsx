"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/types/database";

type DealWithRelations = Tables<"deals"> & {
  contacts?: { id: string; first_name: string; last_name: string } | null;
  users?: { id: string; full_name: string; avatar_url: string | null } | null;
};

type KanbanCardProps = {
  deal: DealWithRelations;
  onClick: (deal: DealWithRelations) => void;
};

export function KanbanCard({ deal, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, data: { deal } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const contact = deal.contacts as DealWithRelations["contacts"];
  const owner = deal.users as DealWithRelations["users"];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-kanban-card
      onClick={() => onClick(deal)}
      className={cn(
        "glass-panel cursor-grab rounded-xl p-4 transition-all duration-200 active:cursor-grabbing",
        isDragging && "z-50 rotate-2 scale-105 shadow-2xl glow-violet opacity-90",
        !isDragging && "hover:translate-y-[-1px] hover:shadow-lg"
      )}
    >
      <h4 className="text-sm font-medium text-text-primary line-clamp-2">
        {deal.title}
      </h4>

      <p className="mt-2 font-mono text-lg font-semibold text-text-primary">
        {formatCurrency(deal.value, deal.currency)}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-text-tertiary">
          {contact && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {contact.first_name} {contact.last_name}
            </span>
          )}
          {deal.expected_close_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(deal.expected_close_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        {deal.priority && (
          <Badge
            variant={
              deal.priority === "Critical"
                ? "danger"
                : deal.priority === "High"
                  ? "warning"
                  : "secondary"
            }
          >
            {deal.priority}
          </Badge>
        )}
      </div>

      {owner && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary/20 text-[9px] font-medium text-accent-glow">
            {owner.full_name?.charAt(0)}
          </div>
          <span className="text-xs text-text-tertiary">{owner.full_name}</span>
        </div>
      )}
    </div>
  );
}
