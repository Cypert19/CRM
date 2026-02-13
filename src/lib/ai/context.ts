import { createClient } from "@/lib/supabase/server";

export async function assembleContext(): Promise<string> {
  try {
    const supabase = await createClient();

    const [dealsRes, contactsRes, activitiesRes] = await Promise.all([
      supabase
        .from("deals")
        .select("id, title, value, currency, priority, expected_close_date, pipeline_stages(name), contacts(first_name, last_name), companies(company_name)")
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

    // Count KB documents per deal (files with extracted text) - separate query to avoid type inference issues
    const kbCountsRes = await supabase
      .from("files")
      .select("deal_id")
      .not("extracted_text", "is", null)
      .not("deal_id", "is", null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deals = (dealsRes.data ?? []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contacts = (contactsRes.data ?? []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activities = (activitiesRes.data ?? []) as any[];

    // Build KB document count per deal
    const kbCountMap = new Map<string, number>();
    if (kbCountsRes.data) {
      for (const row of kbCountsRes.data as Array<{ deal_id: string | null }>) {
        const dealId = row.deal_id;
        if (dealId) {
          kbCountMap.set(dealId, (kbCountMap.get(dealId) || 0) + 1);
        }
      }
    }

    let context = "=== CURRENT CRM DATA ===\n\n";

    if (deals.length > 0) {
      context += `DEALS (${deals.length} total):\n`;
      for (const d of deals) {
        const stage = d.pipeline_stages?.name ?? "Unknown";
        const contact = d.contacts;
        const company = d.companies;
        context += `- "${d.title}" | $${d.value} ${d.currency} | Stage: ${stage}`;
        if (contact) context += ` | Contact: ${contact.first_name} ${contact.last_name}`;
        if (company) context += ` | Company: ${company.company_name}`;
        if (d.expected_close_date) context += ` | Close: ${d.expected_close_date}`;
        const kbCount = kbCountMap.get(d.id) || 0;
        if (kbCount > 0) context += ` | KB docs: ${kbCount}`;
        context += "\n";
      }
      context += "\n";
    }

    if (contacts.length > 0) {
      context += `CONTACTS (${contacts.length} total):\n`;
      for (const c of contacts) {
        const company = c.companies;
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
        const meta = a.metadata;
        context += `- [${a.activity_type}] ${meta?.title ?? meta?.name ?? ""} (${a.created_at})\n`;
      }
    }

    return context;
  } catch {
    return "Unable to fetch CRM context. The user may need to set up their workspace first.";
  }
}
