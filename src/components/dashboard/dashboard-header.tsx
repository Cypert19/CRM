"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical, Check, X, ChevronDown } from "lucide-react";
import type { CustomDashboard } from "@/types/dashboard";

type Props = {
  dashboard: CustomDashboard;
  dashboards: CustomDashboard[];
  editMode: boolean;
  onToggleEditMode: () => void;
  onAddTile: () => void;
  onSelectDashboard: (id: string) => void;
  onRenameDashboard: (name: string) => void;
  onDeleteDashboard: () => void;
};

export function DashboardHeader({
  dashboard,
  dashboards,
  editMode,
  onToggleEditMode,
  onAddTile,
  onSelectDashboard,
  onRenameDashboard,
  onDeleteDashboard,
}: Props) {
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(dashboard.name);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const handleRenameSubmit = () => {
    if (nameInput.trim() && nameInput !== dashboard.name) {
      onRenameDashboard(nameInput.trim());
    }
    setRenaming(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Dashboard selector */}
        {dashboards.length > 1 ? (
          <div className="relative">
            <button
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="focus-ring flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-bg-elevated/50"
            >
              {renaming ? null : dashboard.name}
              <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
            </button>
            {selectorOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSelectorOpen(false)} />
                <div className="glass-panel absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-xl p-1">
                  {dashboards.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        onSelectDashboard(d.id);
                        setSelectorOpen(false);
                      }}
                      className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm ${
                        d.id === dashboard.id
                          ? "bg-accent-primary/10 text-accent-primary"
                          : "text-text-secondary hover:bg-bg-elevated/50 hover:text-text-primary"
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : renaming ? null : (
          <span className="text-sm font-medium text-text-primary">{dashboard.name}</span>
        )}

        {/* Inline rename */}
        {renaming && (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") setRenaming(false);
              }}
              className="focus-ring rounded-lg bg-bg-elevated/50 px-2.5 py-1 text-sm text-text-primary outline-none"
            />
            <button onClick={handleRenameSubmit} className="rounded-md p-1 text-signal-success hover:bg-bg-elevated/50">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setRenaming(false)} className="rounded-md p-1 text-text-tertiary hover:bg-bg-elevated/50">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAddTile}
          className="gradient-button flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Tile
        </button>

        <button
          onClick={onToggleEditMode}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            editMode
              ? "border-accent-primary/30 bg-accent-primary/10 text-accent-primary"
              : "border-border-glass text-text-secondary hover:bg-bg-elevated/50 hover:text-text-primary"
          }`}
        >
          <GripVertical className="h-3.5 w-3.5" />
          {editMode ? "Done" : "Edit Layout"}
        </button>

        {!renaming && (
          <>
            <button
              onClick={() => {
                setNameInput(dashboard.name);
                setRenaming(true);
              }}
              className="rounded-lg border border-border-glass p-1.5 text-text-tertiary hover:bg-bg-elevated/50 hover:text-text-primary"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={onDeleteDashboard}
              className="rounded-lg border border-border-glass p-1.5 text-text-tertiary hover:bg-bg-elevated/50 hover:text-signal-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
