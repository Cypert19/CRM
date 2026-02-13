"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type {
  ImportPayload,
  ImportResult,
  ImportError,
  DuplicateReport,
  DuplicateMatch,
  ParsedCompany,
  ParsedContact,
  ParsedDeal,
  ParsedNote,
  ParsedTask,
} from "@/types/import";

export async function executeImport(
  payload: ImportPayload
): Promise<ActionResponse<ImportResult>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) {
      return { success: false, error: "No workspace found. Please log out and log back in." };
    }

    const admin = createAdminClient();
    const idMap = new Map<string, string>(); // tempId → realId
    const errors: ImportError[] = [];
    const counts = {
      companies: { success: 0, failed: 0 },
      contacts: { success: 0, failed: 0 },
      deals: { success: 0, failed: 0 },
      notes: { success: 0, failed: 0 },
      tasks: { success: 0, failed: 0 },
    };

    // ── Step 1: Insert Companies ──────────────────────────────────────────
    for (const company of payload.companies) {
      try {
        const { _tempId, ...rest } = company;
        const insertData = cleanCompanyData(rest);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (admin.from("companies") as any)
          .insert({
            ...insertData,
            workspace_id: ctx.workspaceId,
            owner_id: ctx.userId,
          })
          .select("id")
          .single();

        if (error) {
          errors.push({ entityType: "Company", tempId: _tempId, error: error.message });
          counts.companies.failed++;
        } else if (data) {
          idMap.set(_tempId, data.id);
          counts.companies.success++;
        }
      } catch (e) {
        errors.push({
          entityType: "Company",
          tempId: company._tempId,
          error: e instanceof Error ? e.message : "Unknown error",
        });
        counts.companies.failed++;
      }
    }

    // ── Step 2: Insert Contacts ───────────────────────────────────────────
    for (const contact of payload.contacts) {
      try {
        const { _tempId, _companyTempId, ...rest } = contact;
        const insertData = cleanContactData(rest);

        // Resolve company reference
        if (_companyTempId && idMap.has(_companyTempId)) {
          insertData.company_id = idMap.get(_companyTempId)!;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (admin.from("contacts") as any)
          .insert({
            ...insertData,
            workspace_id: ctx.workspaceId,
            owner_id: ctx.userId,
          })
          .select("id")
          .single();

        if (error) {
          errors.push({ entityType: "Contact", tempId: _tempId, error: error.message });
          counts.contacts.failed++;
        } else if (data) {
          idMap.set(_tempId, data.id);
          counts.contacts.success++;
        }
      } catch (e) {
        errors.push({
          entityType: "Contact",
          tempId: contact._tempId,
          error: e instanceof Error ? e.message : "Unknown error",
        });
        counts.contacts.failed++;
      }
    }

    // ── Step 3: Insert Deals ──────────────────────────────────────────────
    for (const deal of payload.deals) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _tempId, _contactTempId, _companyTempId, _stageName, ...rest } = deal;
        const insertData = cleanDealData(rest);

        // Resolve references
        if (_contactTempId && idMap.has(_contactTempId)) {
          insertData.contact_id = idMap.get(_contactTempId)!;
        }
        if (_companyTempId && idMap.has(_companyTempId)) {
          insertData.company_id = idMap.get(_companyTempId)!;
        }

        // Ensure deal has stage_id and pipeline_id
        if (!insertData.stage_id || !insertData.pipeline_id) {
          errors.push({
            entityType: "Deal",
            tempId: _tempId,
            error: "Deal requires a mapped pipeline stage. Please map all stages before importing.",
          });
          counts.deals.failed++;
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (admin.from("deals") as any)
          .insert({
            ...insertData,
            workspace_id: ctx.workspaceId,
            owner_id: ctx.userId,
          })
          .select("id")
          .single();

        if (error) {
          errors.push({ entityType: "Deal", tempId: _tempId, error: error.message });
          counts.deals.failed++;
        } else if (data) {
          idMap.set(_tempId, data.id);
          counts.deals.success++;
        }
      } catch (e) {
        errors.push({
          entityType: "Deal",
          tempId: deal._tempId,
          error: e instanceof Error ? e.message : "Unknown error",
        });
        counts.deals.failed++;
      }
    }

    // ── Step 4: Insert Notes ──────────────────────────────────────────────
    for (const note of payload.notes) {
      try {
        const { _tempId, _dealTempId, _contactTempId, _companyTempId, ...rest } = note;
        const insertData = cleanNoteData(rest);

        if (_dealTempId && idMap.has(_dealTempId)) {
          insertData.deal_id = idMap.get(_dealTempId)!;
        }
        if (_contactTempId && idMap.has(_contactTempId)) {
          insertData.contact_id = idMap.get(_contactTempId)!;
        }
        if (_companyTempId && idMap.has(_companyTempId)) {
          insertData.company_id = idMap.get(_companyTempId)!;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (admin.from("notes") as any)
          .insert({
            ...insertData,
            content: {}, // Empty TipTap JSON — plain_text is the main content
            workspace_id: ctx.workspaceId,
            author_id: ctx.userId,
          })
          .select("id")
          .single();

        if (error) {
          errors.push({ entityType: "Note", tempId: _tempId, error: error.message });
          counts.notes.failed++;
        } else if (data) {
          idMap.set(_tempId, data.id);
          counts.notes.success++;
        }
      } catch (e) {
        errors.push({
          entityType: "Note",
          tempId: note._tempId,
          error: e instanceof Error ? e.message : "Unknown error",
        });
        counts.notes.failed++;
      }
    }

    // ── Step 5: Insert Tasks ──────────────────────────────────────────────
    for (const task of payload.tasks) {
      try {
        const { _tempId, _dealTempId, _contactTempId, ...rest } = task;
        const insertData = cleanTaskData(rest);

        if (_dealTempId && idMap.has(_dealTempId)) {
          insertData.deal_id = idMap.get(_dealTempId)!;
        }
        if (_contactTempId && idMap.has(_contactTempId)) {
          insertData.contact_id = idMap.get(_contactTempId)!;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (admin.from("tasks") as any)
          .insert({
            ...insertData,
            workspace_id: ctx.workspaceId,
            creator_id: ctx.userId,
          })
          .select("id")
          .single();

        if (error) {
          errors.push({ entityType: "Task", tempId: _tempId, error: error.message });
          counts.tasks.failed++;
        } else if (data) {
          idMap.set(_tempId, data.id);
          counts.tasks.success++;
        }
      } catch (e) {
        errors.push({
          entityType: "Task",
          tempId: task._tempId,
          error: e instanceof Error ? e.message : "Unknown error",
        });
        counts.tasks.failed++;
      }
    }

    // ── Log Activity ────────────────────────────────────────────────────
    const totalCreated =
      counts.companies.success +
      counts.contacts.success +
      counts.deals.success +
      counts.notes.success +
      counts.tasks.success;
    const totalFailed =
      counts.companies.failed +
      counts.contacts.failed +
      counts.deals.failed +
      counts.notes.failed +
      counts.tasks.failed;

    if (totalCreated > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from("activities") as any).insert({
        workspace_id: ctx.workspaceId,
        activity_type: "bulk_import",
        actor_id: ctx.userId,
        entity_type: "Deal",
        entity_id: ctx.workspaceId, // No single entity — use workspace
        metadata: {
          totalCreated,
          totalFailed,
          counts,
        },
      });
    }

    // ── Revalidate All Routes ───────────────────────────────────────────
    revalidatePath("/deals");
    revalidatePath("/contacts");
    revalidatePath("/companies");
    revalidatePath("/tasks");
    revalidatePath("/notes");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { counts, errors, totalCreated, totalFailed },
    };
  } catch (e) {
    console.error("Import execution error:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to execute import",
    };
  }
}

// ── Duplicate Detection ─────────────────────────────────────────────────────

export async function checkDuplicates(
  contacts: { _tempId: string; email?: string | null; first_name?: string; last_name?: string }[],
  companies: { _tempId: string; company_name: string; domain?: string | null }[]
): Promise<ActionResponse<DuplicateReport>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) {
      return { success: false, error: "No workspace found" };
    }

    const admin = createAdminClient();
    const contactDupes: DuplicateMatch[] = [];
    const companyDupes: DuplicateMatch[] = [];

    // Check contacts by email
    const emails = contacts
      .map((c) => c.email)
      .filter((e): e is string => !!e && e.length > 0);

    if (emails.length > 0) {
      const { data: existingContacts } = await admin
        .from("contacts")
        .select("id, email, first_name, last_name")
        .eq("workspace_id", ctx.workspaceId)
        .is("deleted_at", null)
        .in("email", emails);

      if (existingContacts) {
        for (const existing of existingContacts) {
          const match = contacts.find(
            (c) => c.email && c.email.toLowerCase() === existing.email?.toLowerCase()
          );
          if (match) {
            contactDupes.push({
              tempId: match._tempId,
              existingId: existing.id,
              existingName: `${existing.first_name} ${existing.last_name}`,
              matchField: "email",
            });
          }
        }
      }
    }

    // Check companies by name
    const companyNames = companies.map((c) => c.company_name).filter(Boolean);

    if (companyNames.length > 0) {
      const { data: existingCompanies } = await admin
        .from("companies")
        .select("id, company_name, domain")
        .eq("workspace_id", ctx.workspaceId)
        .is("deleted_at", null)
        .in("company_name", companyNames);

      if (existingCompanies) {
        for (const existing of existingCompanies) {
          const match = companies.find(
            (c) =>
              c.company_name.toLowerCase() === existing.company_name.toLowerCase()
          );
          if (match) {
            companyDupes.push({
              tempId: match._tempId,
              existingId: existing.id,
              existingName: existing.company_name,
              matchField: "company_name",
            });
          }
        }
      }
    }

    return {
      success: true,
      data: { contacts: contactDupes, companies: companyDupes },
    };
  } catch {
    return { success: false, error: "Failed to check duplicates" };
  }
}

// ── Data Cleaning Helpers ───────────────────────────────────────────────────

function cleanCompanyData(data: Omit<ParsedCompany, "_tempId">): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (data.company_name) clean.company_name = data.company_name;
  if (data.domain) clean.domain = data.domain;
  if (data.industry) clean.industry = data.industry;
  if (data.employee_count_range) clean.employee_count_range = data.employee_count_range;
  if (data.annual_revenue_range) clean.annual_revenue_range = data.annual_revenue_range;
  if (data.phone) clean.phone = data.phone;
  if (data.website) clean.website = data.website;
  if (data.description) clean.description = data.description;
  if (data.address) clean.address = data.address;
  if (data.tags && data.tags.length > 0) clean.tags = data.tags;
  return clean;
}

function cleanContactData(data: Omit<ParsedContact, "_tempId" | "_companyTempId">): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (data.first_name) clean.first_name = data.first_name;
  if (data.last_name) clean.last_name = data.last_name;
  if (data.email) clean.email = data.email;
  if (data.phone) clean.phone = data.phone;
  if (data.job_title) clean.job_title = data.job_title;
  if (data.lifecycle_stage) clean.lifecycle_stage = data.lifecycle_stage;
  if (data.source) clean.source = data.source;
  if (data.address) clean.address = data.address;
  if (data.social_profiles) clean.social_profiles = data.social_profiles;
  if (data.tags && data.tags.length > 0) clean.tags = data.tags;
  return clean;
}

function cleanDealData(data: Omit<ParsedDeal, "_tempId" | "_contactTempId" | "_companyTempId" | "_stageName">): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (data.title) clean.title = data.title;
  if (data.value !== undefined && data.value !== null) clean.value = data.value;
  if (data.currency) clean.currency = data.currency;
  if (data.stage_id) clean.stage_id = data.stage_id;
  if (data.pipeline_id) clean.pipeline_id = data.pipeline_id;
  if (data.contact_id) clean.contact_id = data.contact_id;
  if (data.company_id) clean.company_id = data.company_id;
  if (data.expected_close_date) clean.expected_close_date = data.expected_close_date;
  if (data.probability !== undefined && data.probability !== null) clean.probability = data.probability;
  if (data.priority) clean.priority = data.priority;
  if (data.source) clean.source = data.source;
  if (data.description) clean.description = data.description;
  if (data.tags && data.tags.length > 0) clean.tags = data.tags;
  return clean;
}

function cleanNoteData(data: Omit<ParsedNote, "_tempId" | "_dealTempId" | "_contactTempId" | "_companyTempId">): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (data.title) clean.title = data.title;
  if (data.plain_text) clean.plain_text = data.plain_text;
  if (data.tags && data.tags.length > 0) clean.tags = data.tags;
  return clean;
}

function cleanTaskData(data: Omit<ParsedTask, "_tempId" | "_dealTempId" | "_contactTempId">): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (data.title) clean.title = data.title;
  if (data.status) clean.status = data.status;
  if (data.priority) clean.priority = data.priority;
  if (data.task_type) clean.task_type = data.task_type;
  if (data.due_date) clean.due_date = data.due_date;
  if (data.notes) clean.notes = data.notes;
  if (data.category) clean.category = data.category;
  return clean;
}
