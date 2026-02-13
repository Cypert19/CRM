"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types/common";
import type { CustomDashboard, DashboardTile, TileData, TileConfig } from "@/types/dashboard";
import {
  createDashboardSchema,
  updateDashboardSchema,
  deleteDashboardSchema,
  addTileSchema,
  updateTileSchema,
  removeTileSchema,
  reorderTilesSchema,
  computeTileDataSchema,
} from "@/validators/dashboard";
import { computeKPIData, computeChartData, computeTableData } from "@/lib/dashboard/aggregation-engine";
import { DEFAULT_TILES } from "@/lib/dashboard/default-tiles";

// ─── Dashboard CRUD ───

export async function getDashboards(): Promise<ActionResponse<CustomDashboard[]>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("custom_dashboards")
      .select("*, dashboard_tiles(*)")
      .eq("workspace_id", ctx.workspaceId)
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: true });

    if (error) return { success: false, error: error.message };

    const dashboards: CustomDashboard[] = (data ?? []).map((d) => ({
      ...d,
      tiles: ((d.dashboard_tiles as unknown[]) ?? [])
        .map((t: unknown) => {
          const tile = t as Record<string, unknown>;
          return {
            ...tile,
            config: tile.config as TileConfig,
          } as DashboardTile;
        })
        .sort((a: DashboardTile, b: DashboardTile) => a.display_order - b.display_order),
    }));

    return { success: true, data: dashboards };
  } catch (err) {
    console.error("[dashboards] getDashboards error:", err);
    return { success: false, error: "Failed to fetch dashboards" };
  }
}

export async function createDashboard(input: unknown): Promise<ActionResponse<CustomDashboard>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const parsed = createDashboardSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const admin = createAdminClient();

    // Check if user has any dashboards yet
    const { count } = await admin
      .from("custom_dashboards")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspaceId)
      .eq("user_id", ctx.userId);

    const isFirst = (count ?? 0) === 0;

    const { data: dashboard, error } = await admin
      .from("custom_dashboards")
      .insert({
        workspace_id: ctx.workspaceId,
        user_id: ctx.userId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        is_default: isFirst,
      })
      .select()
      .single();

    if (error || !dashboard) return { success: false, error: error?.message ?? "Failed to create dashboard" };

    // Seed default tiles for first dashboard
    if (isFirst && DEFAULT_TILES.length > 0) {
      const tilesToInsert = DEFAULT_TILES.map((tile, index) => ({
        dashboard_id: dashboard.id,
        workspace_id: ctx.workspaceId,
        title: tile.title,
        tile_type: tile.tile_type,
        grid_x: 0,
        grid_y: 0,
        grid_w: tile.grid_w,
        grid_h: tile.grid_h,
        display_order: index,
        config: tile.config,
      }));

      await admin.from("dashboard_tiles").insert(tilesToInsert);
    }

    // Refetch with tiles
    const { data: full } = await admin
      .from("custom_dashboards")
      .select("*, dashboard_tiles(*)")
      .eq("id", dashboard.id)
      .single();

    const result: CustomDashboard = {
      ...full!,
      tiles: ((full?.dashboard_tiles as unknown[]) ?? [])
        .map((t: unknown) => {
          const tile = t as Record<string, unknown>;
          return { ...tile, config: tile.config as TileConfig } as DashboardTile;
        })
        .sort((a: DashboardTile, b: DashboardTile) => a.display_order - b.display_order),
    };

    revalidatePath("/reports");
    return { success: true, data: result };
  } catch (err) {
    console.error("[dashboards] createDashboard error:", err);
    return { success: false, error: "Failed to create dashboard" };
  }
}

export async function updateDashboard(input: unknown): Promise<ActionResponse<CustomDashboard>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const parsed = updateDashboardSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const admin = createAdminClient();
    const { id, ...updates } = parsed.data;

    // If setting as default, unset other defaults first
    if (updates.is_default) {
      await admin
        .from("custom_dashboards")
        .update({ is_default: false })
        .eq("workspace_id", ctx.workspaceId)
        .eq("user_id", ctx.userId);
    }

    const { error } = await admin
      .from("custom_dashboards")
      .update(updates)
      .eq("id", id)
      .eq("user_id", ctx.userId);

    if (error) return { success: false, error: error.message };

    // Refetch
    const { data: full } = await admin
      .from("custom_dashboards")
      .select("*, dashboard_tiles(*)")
      .eq("id", id)
      .single();

    const result: CustomDashboard = {
      ...full!,
      tiles: ((full?.dashboard_tiles as unknown[]) ?? [])
        .map((t: unknown) => {
          const tile = t as Record<string, unknown>;
          return { ...tile, config: tile.config as TileConfig } as DashboardTile;
        })
        .sort((a: DashboardTile, b: DashboardTile) => a.display_order - b.display_order),
    };

    revalidatePath("/reports");
    return { success: true, data: result };
  } catch (err) {
    console.error("[dashboards] updateDashboard error:", err);
    return { success: false, error: "Failed to update dashboard" };
  }
}

export async function deleteDashboard(input: unknown): Promise<ActionResponse<void>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const parsed = deleteDashboardSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const admin = createAdminClient();
    const { error } = await admin
      .from("custom_dashboards")
      .delete()
      .eq("id", parsed.data.id)
      .eq("user_id", ctx.userId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/reports");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[dashboards] deleteDashboard error:", err);
    return { success: false, error: "Failed to delete dashboard" };
  }
}

// ─── Tile CRUD ───

export async function addTile(input: unknown): Promise<ActionResponse<DashboardTile>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const parsed = addTileSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const admin = createAdminClient();

    // Verify dashboard ownership
    const { data: dashboard } = await admin
      .from("custom_dashboards")
      .select("id")
      .eq("id", parsed.data.dashboard_id)
      .eq("user_id", ctx.userId)
      .single();

    if (!dashboard) return { success: false, error: "Dashboard not found" };

    // Get next display_order
    const { data: existing } = await admin
      .from("dashboard_tiles")
      .select("display_order")
      .eq("dashboard_id", parsed.data.dashboard_id)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder = existing?.length ? (existing[0].display_order + 1) : 0;

    const { data: tile, error } = await admin
      .from("dashboard_tiles")
      .insert({
        dashboard_id: parsed.data.dashboard_id,
        workspace_id: ctx.workspaceId,
        title: parsed.data.title,
        tile_type: parsed.data.tile_type,
        grid_x: parsed.data.grid_x,
        grid_y: parsed.data.grid_y,
        grid_w: parsed.data.grid_w,
        grid_h: parsed.data.grid_h,
        display_order: nextOrder,
        config: parsed.data.config,
      })
      .select()
      .single();

    if (error || !tile) return { success: false, error: error?.message ?? "Failed to add tile" };

    return {
      success: true,
      data: { ...tile, config: tile.config as TileConfig } as DashboardTile,
    };
  } catch (err) {
    console.error("[dashboards] addTile error:", err);
    return { success: false, error: "Failed to add tile" };
  }
}

export async function updateTile(input: unknown): Promise<ActionResponse<DashboardTile>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const parsed = updateTileSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const admin = createAdminClient();
    const { id, ...updates } = parsed.data;

    const { data: tile, error } = await admin
      .from("dashboard_tiles")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .select()
      .single();

    if (error || !tile) return { success: false, error: error?.message ?? "Failed to update tile" };

    return {
      success: true,
      data: { ...tile, config: tile.config as TileConfig } as DashboardTile,
    };
  } catch (err) {
    console.error("[dashboards] updateTile error:", err);
    return { success: false, error: "Failed to update tile" };
  }
}

export async function removeTile(input: unknown): Promise<ActionResponse<void>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const parsed = removeTileSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const admin = createAdminClient();
    const { error } = await admin
      .from("dashboard_tiles")
      .delete()
      .eq("id", parsed.data.id)
      .eq("workspace_id", ctx.workspaceId);

    if (error) return { success: false, error: error.message };

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[dashboards] removeTile error:", err);
    return { success: false, error: "Failed to remove tile" };
  }
}

export async function reorderTiles(input: unknown): Promise<ActionResponse<void>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const parsed = reorderTilesSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const admin = createAdminClient();

    // Verify dashboard ownership
    const { data: dashboard } = await admin
      .from("custom_dashboards")
      .select("id")
      .eq("id", parsed.data.dashboard_id)
      .eq("user_id", ctx.userId)
      .single();

    if (!dashboard) return { success: false, error: "Dashboard not found" };

    // Batch update tiles
    const updates = parsed.data.tiles.map((t) =>
      admin
        .from("dashboard_tiles")
        .update({
          grid_x: t.grid_x,
          grid_y: t.grid_y,
          grid_w: t.grid_w,
          grid_h: t.grid_h,
          display_order: t.display_order,
        })
        .eq("id", t.id)
        .eq("workspace_id", ctx.workspaceId)
    );

    await Promise.all(updates);

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[dashboards] reorderTiles error:", err);
    return { success: false, error: "Failed to reorder tiles" };
  }
}

// ─── Compute Tile Data ───

export async function computeTileData(input: unknown): Promise<ActionResponse<TileData>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const parsed = computeTileDataSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const { tile_type, config } = parsed.data;

    let data: TileData;

    switch (tile_type) {
      case "kpi":
        data = await computeKPIData(config as Parameters<typeof computeKPIData>[0], ctx.workspaceId);
        break;
      case "chart":
        data = await computeChartData(config as Parameters<typeof computeChartData>[0], ctx.workspaceId);
        break;
      case "table":
        data = await computeTableData(config as Parameters<typeof computeTableData>[0], ctx.workspaceId);
        break;
      default:
        return { success: false, error: `Unknown tile type: ${tile_type}` };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[dashboards] computeTileData error:", err);
    return { success: false, error: "Failed to compute tile data" };
  }
}
