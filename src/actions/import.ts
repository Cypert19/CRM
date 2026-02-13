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

// ── Batch insert helper ─────────────────────────────────────────────────────
// Inserts an array of rows in a single DB call and returns the created rows.

async function batchInsert(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  table: string,
  rows: Record<string, unknown>[]
): Promise<{ data: { id: string }[] | null; error: { message: string } | null }> {
  if (rows.length === 0) return { data: [], error: null };

  const result = await admin
    .from(table)
    .insert(rows)
    .select("id");

  return result;
}

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

    // ── Step 1: Batch Insert Companies ──────────────────────────────────────
    if (payload.companies.length > 0) {
      const companyTempIds = payload.companies.map((c) => c._tempId);
      const companyRows = payload.companies.map((company) => {
        const { _tempId, ...rest } = company;
        void _tempId;
        return {
          ...cleanCompanyData(rest),
          workspace_id: ctx.workspaceId,
          owner_id: ctx.userId,
        };
      });

      const { data, error } = await batchInsert(admin, "companies", companyRows);

      if (error) {
        // Batch failed — record all as errors
        for (const tempId of companyTempIds) {
          errors.push({ entityType: "Company", tempId, error: error.message });
        }
        counts.companies.failed += companyTempIds.length;
      } else if (data) {
        // Map temp IDs to real IDs (insertion order is preserved)
        for (let i = 0; i < data.length; i++) {
          idMap.set(companyTempIds[i], data[i].id);
        }
        counts.companies.success += data.length;
      }
    }

    // ── Step 2: Batch Insert Contacts ───────────────────────────────────────
    if (payload.contacts.length > 0) {
      const contactTempIds = payload.contacts.map((c) => c._tempId);
      const contactRows = payload.contacts.map((contact) => {
        const { _tempId, _companyTempId, ...rest } = contact;
        void _tempId;
        const insertData = cleanContactData(rest);

        // Resolve company reference
        if (_companyTempId && idMap.has(_companyTempId)) {
          insertData.company_id = idMap.get(_companyTempId)!;
        }

        return {
          ...insertData,
          workspace_id: ctx.workspaceId,
          owner_id: ctx.userId,
        };
      });

      const { data, error } = await batchInsert(admin, "contacts", contactRows);

      if (error) {
        for (const tempId of contactTempIds) {
          errors.push({ entityType: "Contact", tempId, error: error.message });
        }
        counts.contacts.failed += contactTempIds.length;
      } else if (data) {
        for (let i = 0; i < data.length; i++) {
          idMap.set(contactTempIds[i], data[i].id);
        }
        counts.contacts.success += data.length;
      }
    }

    // ── Step 3: Batch Insert Deals ──────────────────────────────────────────
    if (payload.deals.length > 0) {
      // Separate valid deals from those missing stage mapping
      const validDeals: { tempId: string; row: Record<string, unknown> }[] = [];

      for (const deal of payload.deals) {
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

        validDeals.push({
          tempId: _tempId,
          row: {
            ...insertData,
            workspace_id: ctx.workspaceId,
            owner_id: ctx.userId,
          },
        });
      }

      if (validDeals.length > 0) {
        const dealTempIds = validDeals.map((d) => d.tempId);
        const dealRows = validDeals.map((d) => d.row);

        const { data, error } = await batchInsert(admin, "deals", dealRows);

        if (error) {
          for (const tempId of dealTempIds) {
            errors.push({ entityType: "Deal", tempId, error: error.message });
          }
          counts.deals.failed += dealTempIds.length;
        } else if (data) {
          for (let i = 0; i < data.length; i++) {
            idMap.set(dealTempIds[i], data[i].id);
          }
          counts.deals.success += data.length;
        }
      }
    }

    // ── Step 4: Batch Insert Notes ──────────────────────────────────────────
    if (payload.notes.length > 0) {
      const noteTempIds = payload.notes.map((n) => n._tempId);
      const noteRows = payload.notes.map((note) => {
        const { _tempId, _dealTempId, _contactTempId, _companyTempId, ...rest } = note;
        void _tempId;
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

        return {
          ...insertData,
          content: {}, // Empty TipTap JSON — plain_text is the main content
          workspace_id: ctx.workspaceId,
          author_id: ctx.userId,
        };
      });

      const { data, error } = await batchInsert(admin, "notes", noteRows);

      if (error) {
        for (const tempId of noteTempIds) {
          errors.push({ entityType: "Note", tempId, error: error.message });
        }
        counts.notes.failed += noteTempIds.length;
      } else if (data) {
        for (let i = 0; i < data.length; i++) {
          idMap.set(noteTempIds[i], data[i].id);
        }
        counts.notes.success += data.length;
      }
    }

    // ── Step 5: Batch Insert Tasks ──────────────────────────────────────────
    if (payload.tasks.length > 0) {
      const taskTempIds = payload.tasks.map((t) => t._tempId);
      const taskRows = payload.tasks.map((task) => {
        const { _tempId, _dealTempId, _contactTempId, ...rest } = task;
        void _tempId;
        const insertData = cleanTaskData(rest);

        if (_dealTempId && idMap.has(_dealTempId)) {
          insertData.deal_id = idMap.get(_dealTempId)!;
        }
        if (_contactTempId && idMap.has(_contactTempId)) {
          insertData.contact_id = idMap.get(_contactTempId)!;
        }

        return {
          ...insertData,
          workspace_id: ctx.workspaceId,
          creator_id: ctx.userId,
        };
      });

      const { data, error } = await batchInsert(admin, "tasks", taskRows);

      if (error) {
        for (const tempId of taskTempIds) {
          errors.push({ entityType: "Task", tempId, error: error.message });
        }
        counts.tasks.failed += taskTempIds.length;
      } else if (data) {
        for (let i = 0; i < data.length; i++) {
          idMap.set(taskTempIds[i], data[i].id);
        }
        counts.tasks.success += data.length;
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
