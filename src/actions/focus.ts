"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResponse } from "@/types/common";

/* ─── Types ─── */

export type FocusTaskContext = {
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    task_type: string | null;
    notes: string | null;
    due_date: string | null;
    due_time: string | null;
    start_date: string | null;
    end_date: string | null;
    estimated_minutes: number | null;
    category: string | null;
    created_at: string;
    assignee: { full_name: string } | null;
    creator: { full_name: string } | null;
  };
  deal: {
    id: string;
    title: string;
    value: number;
    currency: string;
    stage: string;
    priority: string | null;
    expected_close_date: string | null;
    description: string | null;
    next_step: string | null;
    source: string | null;
    company: { company_name: string; industry: string | null } | null;
  } | null;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    company: { company_name: string } | null;
  } | null;
  dealNotes: {
    id: string;
    title: string | null;
    plain_text: string;
    created_at: string;
    author: { full_name: string } | null;
  }[];
  contactNotes: {
    id: string;
    title: string | null;
    plain_text: string;
    created_at: string;
    author: { full_name: string } | null;
  }[];
  dealTranscripts: {
    id: string;
    deal_id: string;
    title: string;
    transcript_text: string;
    created_at: string;
  }[];
  recentActivities: {
    activity_type: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }[];
  dealKBDocuments: {
    id: string;
    original_filename: string;
    category: string | null;
    extracted_text: string;
    file_size_bytes: number;
    created_at: string;
  }[];
};

/* ─── Server Action ─── */

export async function getFocusTaskContext(
  taskId: string
): Promise<ActionResponse<FocusTaskContext>> {
  try {
    const admin = createAdminClient();

    // 1. Fetch the task itself with assignee and creator
    const { data: task, error: taskError } = await admin
      .from("tasks")
      .select(
        `
        id, title, status, priority, task_type, notes,
        due_date, due_time, start_date, end_date,
        estimated_minutes, category, created_at,
        deal_id, contact_id,
        users!tasks_assignee_id_fkey(full_name),
        creator:users!tasks_creator_id_fkey(full_name)
      `
      )
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return { success: false, error: taskError?.message || "Task not found" };
    }

    // 2. Fetch linked deal with stage and company
    let deal: FocusTaskContext["deal"] = null;
    if (task.deal_id) {
      const { data: dealData } = await admin
        .from("deals")
        .select(
          `
          id, title, value, currency, priority,
          expected_close_date, description, next_step, source,
          pipeline_stages(name),
          companies(company_name, industry)
        `
        )
        .eq("id", task.deal_id)
        .single();

      if (dealData) {
        const stage = (dealData.pipeline_stages as { name: string } | null)?.name ?? "Unknown";
        const company = dealData.companies as { company_name: string; industry: string | null } | null;
        deal = {
          id: dealData.id,
          title: dealData.title,
          value: dealData.value,
          currency: dealData.currency,
          stage,
          priority: dealData.priority,
          expected_close_date: dealData.expected_close_date,
          description: dealData.description ?? null,
          next_step: dealData.next_step ?? null,
          source: dealData.source ?? null,
          company,
        };
      }
    }

    // 3. Fetch linked contact with company
    let contact: FocusTaskContext["contact"] = null;
    if (task.contact_id) {
      const { data: contactData } = await admin
        .from("contacts")
        .select(
          `id, first_name, last_name, email, phone, job_title, companies(company_name)`
        )
        .eq("id", task.contact_id)
        .single();

      if (contactData) {
        contact = {
          ...contactData,
          company: contactData.companies as { company_name: string } | null,
        };
      }
    }

    // 4–8. Parallel fetches for notes, transcripts, activities, KB documents
    const [dealNotesRes, contactNotesRes, transcriptsRes, activitiesRes, kbDocsRes] =
      await Promise.all([
        // Deal notes (up to 10)
        task.deal_id
          ? admin
              .from("notes")
              .select(
                "id, title, plain_text, created_at, users!notes_author_id_fkey(full_name)"
              )
              .eq("deal_id", task.deal_id)
              .order("created_at", { ascending: false })
              .limit(10)
          : Promise.resolve({ data: [], error: null }),

        // Contact notes (up to 5)
        task.contact_id
          ? admin
              .from("notes")
              .select(
                "id, title, plain_text, created_at, users!notes_author_id_fkey(full_name)"
              )
              .eq("contact_id", task.contact_id)
              .order("created_at", { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [], error: null }),

        // Deal transcripts (up to 5)
        task.deal_id
          ? admin
              .from("deal_transcripts")
              .select("id, deal_id, title, transcript_text, created_at")
              .eq("deal_id", task.deal_id)
              .order("created_at", { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [], error: null }),

        // Recent activities for the deal (up to 10)
        task.deal_id
          ? admin
              .from("activities")
              .select("activity_type, metadata, created_at")
              .eq("entity_id", task.deal_id)
              .order("created_at", { ascending: false })
              .limit(10)
          : Promise.resolve({ data: [], error: null }),

        // KB documents with extracted text (up to 10)
        task.deal_id
          ? admin
              .from("files")
              .select("id, original_filename, category, extracted_text, file_size_bytes, created_at")
              .eq("deal_id", task.deal_id)
              .not("extracted_text", "is", null)
              .order("created_at", { ascending: false })
              .limit(10)
          : Promise.resolve({ data: [], error: null }),
      ]);

    const assignee = task.users as { full_name: string } | null;
    const creator = task.creator as { full_name: string } | null;

    const formatNotes = (notes: unknown[]) =>
      (notes || []).map((n: unknown) => {
        const note = n as {
          id: string;
          title: string | null;
          plain_text: string;
          created_at: string;
          users: { full_name: string } | null;
        };
        return {
          id: note.id,
          title: note.title,
          plain_text: note.plain_text,
          created_at: note.created_at,
          author: note.users,
        };
      });

    return {
      success: true,
      data: {
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          task_type: task.task_type,
          notes: task.notes,
          due_date: task.due_date,
          due_time: task.due_time,
          start_date: task.start_date,
          end_date: task.end_date,
          estimated_minutes: task.estimated_minutes,
          category: task.category,
          created_at: task.created_at,
          assignee,
          creator,
        },
        deal,
        contact,
        dealNotes: formatNotes(dealNotesRes.data || []),
        contactNotes: formatNotes(contactNotesRes.data || []),
        dealTranscripts: ((transcriptsRes.data || []) as {
          id: string;
          deal_id: string;
          title: string;
          transcript_text: string;
          created_at: string;
        }[]).map((t) => ({
          id: t.id,
          deal_id: t.deal_id,
          title: t.title,
          transcript_text: t.transcript_text,
          created_at: t.created_at,
        })),
        recentActivities: ((activitiesRes.data || []) as {
          activity_type: string;
          metadata: Record<string, unknown>;
          created_at: string;
        }[]).map((a) => ({
          activity_type: a.activity_type,
          metadata: (a.metadata as Record<string, unknown>) ?? {},
          created_at: a.created_at,
        })),
        dealKBDocuments: ((kbDocsRes.data || []) as {
          id: string;
          original_filename: string;
          category: string | null;
          extracted_text: string;
          file_size_bytes: number;
          created_at: string;
        }[]).map((doc) => ({
          id: doc.id,
          original_filename: doc.original_filename,
          category: doc.category,
          extracted_text: doc.extracted_text,
          file_size_bytes: doc.file_size_bytes,
          created_at: doc.created_at,
        })),
      },
    };
  } catch (error) {
    console.error("Focus context error:", error);
    return { success: false, error: "Failed to fetch task context" };
  }
}
