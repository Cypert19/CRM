"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { getDashboards, createDashboard, updateDashboard, deleteDashboard, reorderTiles, removeTile } from "@/actions/dashboard";
import { DashboardHeader } from "./dashboard-header";
import { DashboardGrid } from "./dashboard-grid";
import { EmptyDashboardState } from "./empty-dashboard-state";
import { TileConfigDialog } from "./tile-config-dialog";
import type { CustomDashboard, DashboardTile } from "@/types/dashboard";

export function CustomDashboardView() {
  const [dashboards, setDashboards] = useState<CustomDashboard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tileDialogOpen, setTileDialogOpen] = useState(false);
  const [editingTile, setEditingTile] = useState<DashboardTile | null>(null);

  const selectedDashboard = dashboards.find((d) => d.id === selectedId) ?? null;

  // Fetch dashboards
  const fetchDashboards = useCallback(async () => {
    const result = await getDashboards();
    if (result.success && result.data) {
      setDashboards(result.data);
      if (!selectedId && result.data.length > 0) {
        const defaultDb = result.data.find((d) => d.is_default) ?? result.data[0];
        setSelectedId(defaultDb.id);
      }
    }
    setLoading(false);
  }, [selectedId]);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  // Create dashboard
  const handleCreateDashboard = async () => {
    const result = await createDashboard({ name: "My Dashboard" });
    if (result.success && result.data) {
      setDashboards((prev) => [...prev, result.data!]);
      setSelectedId(result.data.id);
    }
  };

  // Rename dashboard
  const handleRenameDashboard = async (name: string) => {
    if (!selectedDashboard) return;
    const result = await updateDashboard({ id: selectedDashboard.id, name });
    if (result.success && result.data) {
      setDashboards((prev) =>
        prev.map((d) => (d.id === result.data!.id ? result.data! : d))
      );
    }
  };

  // Delete dashboard
  const handleDeleteDashboard = async () => {
    if (!selectedDashboard) return;
    if (!confirm(`Delete "${selectedDashboard.name}"? This cannot be undone.`)) return;

    const result = await deleteDashboard({ id: selectedDashboard.id });
    if (result.success) {
      const remaining = dashboards.filter((d) => d.id !== selectedDashboard.id);
      setDashboards(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setEditMode(false);
    }
  };

  // Reorder tiles
  const handleReorder = async (updatedTiles: DashboardTile[]) => {
    if (!selectedDashboard) return;

    // Optimistic update
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === selectedDashboard.id ? { ...d, tiles: updatedTiles } : d
      )
    );

    await reorderTiles({
      dashboard_id: selectedDashboard.id,
      tiles: updatedTiles.map((t) => ({
        id: t.id,
        grid_x: t.grid_x,
        grid_y: t.grid_y,
        grid_w: t.grid_w,
        grid_h: t.grid_h,
        display_order: t.display_order,
      })),
    });
  };

  // Delete tile
  const handleDeleteTile = async (tileId: string) => {
    if (!selectedDashboard) return;
    if (!confirm("Delete this tile?")) return;

    const result = await removeTile({ id: tileId });
    if (result.success) {
      setDashboards((prev) =>
        prev.map((d) =>
          d.id === selectedDashboard.id
            ? { ...d, tiles: d.tiles.filter((t) => t.id !== tileId) }
            : d
        )
      );
    }
  };

  // Edit tile
  const handleEditTile = (tile: DashboardTile) => {
    setEditingTile(tile);
    setTileDialogOpen(true);
  };

  // Add tile
  const handleAddTile = () => {
    setEditingTile(null);
    setTileDialogOpen(true);
  };

  // After tile save
  const handleTileSaved = () => {
    setTileDialogOpen(false);
    setEditingTile(null);
    fetchDashboards();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-shimmer h-32 rounded-2xl bg-bg-card" />
        ))}
      </div>
    );
  }

  if (dashboards.length === 0) {
    return <EmptyDashboardState onCreateDashboard={handleCreateDashboard} />;
  }

  if (!selectedDashboard) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <DashboardHeader
        dashboard={selectedDashboard}
        dashboards={dashboards}
        editMode={editMode}
        onToggleEditMode={() => setEditMode(!editMode)}
        onAddTile={handleAddTile}
        onSelectDashboard={setSelectedId}
        onRenameDashboard={handleRenameDashboard}
        onDeleteDashboard={handleDeleteDashboard}
      />

      {selectedDashboard.tiles.length > 0 ? (
        <DashboardGrid
          tiles={selectedDashboard.tiles}
          editMode={editMode}
          onReorder={handleReorder}
          onEditTile={handleEditTile}
          onDeleteTile={handleDeleteTile}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-12 text-center"
        >
          <p className="text-sm text-text-tertiary">No tiles yet.</p>
          <button
            onClick={handleAddTile}
            className="gradient-button mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Your First Tile
          </button>
        </motion.div>
      )}

      <TileConfigDialog
        open={tileDialogOpen}
        onOpenChange={setTileDialogOpen}
        dashboardId={selectedDashboard.id}
        editingTile={editingTile}
        onSaved={handleTileSaved}
      />
    </motion.div>
  );
}
