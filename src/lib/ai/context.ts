import { createClient } from "@/lib/supabase/server";

export async function assembleContext(): Promise<string> {
  try {
    const supabase = await createClient();

    const [dealsRes, contactsRes, activitiesRes] = await Promise.all([
      supabase
        .from("deals")
        .select("title, value, currency, priority, expected_close_date, pipeline_stages(name), contacts(first_name, last_name), companies(company_name)")
        .is("deleted_at", null)
        .order("value", { ascending: false })
        .limit(50),
      supabase
        .from("contacts")
        .select("first_name, last_name, email, job_title, companies(company_name)")
        .is("deleted_at", null)
        .limit(50),
      supabase
        .from("activities")
        .select("activity_type, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const deals = dealsRes.data ?? [];
    const contacts = contactsRes.data ?? [];
    const activities = activitiesRes.data ?? [];

    let context = "=== CURRENT CRM DATA ===\n\n";

    if (deals.length > 0) {
      context += `DEALS (${deals.length} total):\n`;
      for (const d of deals) {
        const stage = (d.pipeline_stages as { name: string } | null)?.name ?? "Unknown";
        const contact = d.contacts as { first_name: string; last_name: string } | null;
        const company = d.companies as { company_name: string } | null;
        context += `- "${d.title}" | $${d.value} ${d.currency} | Stage: ${stage}`;
        if (contact) context += ` | Contact: ${contact.first_name} ${contact.last_name}`;
        if (company) context += ` | Company: ${company.company_name}`;
        if (d.expected_close_date) context += ` | Close: ${d.expected_close_date}`;
        context += "\n";
      }
      context += "\n";
    }

    if (contacts.length > 0) {
      context += `CONTACTS (${contacts.length} total):\n`;
      for (const c of contacts) {
        const company = c.companies as { company_name: string } | null;
        context += `- ${c.first_name} ${c.last_name}`;
        if (c.email) context += ` <${c.email}>`;
        if (c.job_title) context += ` | ${c.job_title}`;
        if (company) context += ` at ${company.company_name}`;
        context += "\n";
      }
      context += "\n";
    }

    if (activities.length > 0) {
      context += `RECENT ACTIVITY:\n`;
      for (const a of activities) {
        const meta = a.metadata as Record<string, unknown>;
        context += `- [${a.activity_type}] ${meta?.title ?? meta?.name ?? ""} (${a.created_at})\n`;
      }
    }

    return context;
  } catch {
    return "Unable to fetch CRM context. The user may need to set up their workspace first.";
  }
}
