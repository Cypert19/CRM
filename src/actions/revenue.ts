"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { upsertRevenueItemSchema, deleteRevenueItemSchema } from "@/validators/deals";
import type { ActionResponse } from "@/types/common";

// ── Types ────────────────────────────────────────────────────────────

export type MonthlyRevenueRow = {
  month: string; // "2025-03-01"
  retainer: number;
  audit_fee: number;
  custom_dev_fee: number;
  total: number;
  is_retainer_amended: boolean;
  is_audit_amended: boolean;
  is_custom_dev_amended: boolean;
};

export type RevenueSchedule = {
  months: MonthlyRevenueRow[];
  totals: { retainer: number; audit_fee: number; custom_dev_fee: number; total: number };
  deal_defaults: { retainer_monthly: number; audit_fee: number; custom_dev_fee: number };
  revenue_start_date: string | null;
  revenue_end_date: string | null;
};

// ── Helpers ──────────────────────────────────────────────────────────

/** Generate an array of "YYYY-MM-01" strings from start to end (inclusive). */
function generateMonthSeries(start: string, end: string): string[] {
  const months: string[] = [];
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);

  let y = sy;
  let m = sm;

  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}-01`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return months;
}

/** Get "YYYY-MM-01" for the current month. */
function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

// ── Actions ──────────────────────────────────────────────────────────

export async function getDealRevenueSchedule(dealId: string): Promise<ActionResponse<RevenueSchedule>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    // Fetch deal defaults & date range
    let deal: {
      retainer_monthly: number | null;
      audit_fee: number | null;
      custom_dev_fee: number | null;
      revenue_start_date: string | null;
      revenue_end_date: string | null;
    } | null = null;

    const { data: dealData, error: dealError } = await admin
      .from("deals")
      .select("retainer_monthly, audit_fee, custom_dev_fee, revenue_start_date, revenue_end_date")
      .eq("id", dealId)
      .eq("workspace_id", ctx.workspaceId)
      .single();

    if (dealError) {
      // If revenue columns don't exist yet (migration not applied), try without them
      if (dealError.message.includes("schema cache") || dealError.message.includes("column")) {
        const { data: fallback, error: fallbackErr } = await admin
          .from("deals")
          .select("retainer_monthly, audit_fee, custom_dev_fee")
          .eq("id", dealId)
          .eq("workspace_id", ctx.workspaceId)
          .single();

        if (fallbackErr || !fallback) return { success: false, error: "Revenue tracking columns not found. Please run migration 00019." };
        deal = { ...fallback, revenue_start_date: null, revenue_end_date: null };
      } else {
        return { success: false, error: dealError.message };
      }
    } else {
      deal = dealData;
    }

    if (!deal) return { success: false, error: "Deal not found" };

    const startDate = deal.revenue_start_date as string | null;
    const endDate = deal.revenue_end_date as string | null;

    if (!startDate) {
      // No revenue tracking configured yet — return empty schedule
      return {
        success: true,
        data: {
          months: [],
          totals: { retainer: 0, audit_fee: 0, custom_dev_fee: 0, total: 0 },
          deal_defaults: {
            retainer_monthly: Number(deal.retainer_monthly ?? 0),
            audit_fee: Number(deal.audit_fee ?? 0),
            custom_dev_fee: Number(deal.custom_dev_fee ?? 0),
          },
          revenue_start_date: null,
          revenue_end_date: endDate,
        },
      };
    }

    // Determine end boundary: explicit end date or current month
    const endBound = endDate ?? currentMonthStr();
    const monthSeries = generateMonthSeries(startDate, endBound);

    // Fetch all amendments for this deal
    const { data: amendments } = await admin
      .from("deal_revenue_items")
      .select("month, item_type, amount")
      .eq("deal_id", dealId);

    // Build lookup: "YYYY-MM-01|item_type" → amount
    const amendmentMap = new Map<string, number>();
    for (const row of amendments ?? []) {
      amendmentMap.set(`${row.month}|${row.item_type}`, Number(row.amount));
    }

    const retainerDefault = Number(deal.retainer_monthly ?? 0);
    const auditDefault = Number(deal.audit_fee ?? 0);
    const customDevDefault = Number(deal.custom_dev_fee ?? 0);

    const totals = { retainer: 0, audit_fee: 0, custom_dev_fee: 0, total: 0 };

    const months: MonthlyRevenueRow[] = monthSeries.map((month, idx) => {
      // Retainer: defaults every month unless amended
      const retainerAmended = amendmentMap.has(`${month}|retainer`);
      const retainer = retainerAmended ? amendmentMap.get(`${month}|retainer`)! : retainerDefault;

      // Audit & Custom Dev: one-time fees default to start month only, unless amended
      const auditAmended = amendmentMap.has(`${month}|audit_fee`);
      const audit = auditAmended
        ? amendmentMap.get(`${month}|audit_fee`)!
        : idx === 0 ? auditDefault : 0;

      const customDevAmended = amendmentMap.has(`${month}|custom_dev_fee`);
      const customDev = customDevAmended
        ? amendmentMap.get(`${month}|custom_dev_fee`)!
        : idx === 0 ? customDevDefault : 0;

      const total = retainer + audit + customDev;

      totals.retainer += retainer;
      totals.audit_fee += audit;
      totals.custom_dev_fee += customDev;
      totals.total += total;

      return {
        month,
        retainer,
        audit_fee: audit,
        custom_dev_fee: customDev,
        total,
        is_retainer_amended: retainerAmended,
        is_audit_amended: auditAmended,
        is_custom_dev_amended: customDevAmended,
      };
    });

    return {
      success: true,
      data: {
        months,
        totals,
        deal_defaults: {
          retainer_monthly: retainerDefault,
          audit_fee: auditDefault,
          custom_dev_fee: customDevDefault,
        },
        revenue_start_date: startDate,
        revenue_end_date: endDate,
      },
    };
  } catch {
    return { success: false, error: "Failed to compute revenue schedule" };
  }
}

export async function upsertRevenueItem(input: unknown): Promise<ActionResponse<{ id: string }>> {
  try {
    const parsed = upsertRevenueItemSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("deal_revenue_items")
      .upsert(
        {
          workspace_id: ctx.workspaceId,
          deal_id: parsed.data.deal_id,
          month: parsed.data.month,
          item_type: parsed.data.item_type,
          amount: parsed.data.amount,
          notes: parsed.data.notes ?? null,
          created_by: ctx.userId,
        },
        { onConflict: "deal_id,month,item_type" }
      )
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/deals/${parsed.data.deal_id}`);
    revalidatePath("/reports");
    return { success: true, data: { id: data.id } };
  } catch {
    return { success: false, error: "Failed to save revenue item" };
  }
}

export async function deleteRevenueItem(input: unknown): Promise<ActionResponse> {
  try {
    const parsed = deleteRevenueItemSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    const { error } = await admin
      .from("deal_revenue_items")
      .delete()
      .eq("deal_id", parsed.data.deal_id)
      .eq("month", parsed.data.month)
      .eq("item_type", parsed.data.item_type);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/deals/${parsed.data.deal_id}`);
    revalidatePath("/reports");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete revenue item" };
  }
}
