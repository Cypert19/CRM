import type { FocusTaskContext } from "@/actions/focus";

/**
 * Assembles the deep context for a task into a structured text block
 * with source tags that the AI can reference with citations.
 */
export function assembleTaskContext(context: FocusTaskContext): string {
  let text = "=== CURRENT FOCUS TASK ===\n\n";

  // Task basics
  text += `TASK: "${context.task.title}"\n`;
  text += `Status: ${context.task.status} | Priority: ${context.task.priority}`;
  if (context.task.task_type) text += ` | Type: ${context.task.task_type}`;
  if (context.task.due_date) text += ` | Due: ${context.task.due_date}`;
  if (context.task.due_time) text += ` at ${context.task.due_time}`;
  if (context.task.estimated_minutes)
    text += ` | Estimated: ${context.task.estimated_minutes} min`;
  if (context.task.category) text += ` | Category: ${context.task.category}`;
  if (context.task.assignee)
    text += `\nAssigned to: ${context.task.assignee.full_name}`;
  if (context.task.creator)
    text += ` | Created by: ${context.task.creator.full_name}`;
  text += "\n";

  // Task notes/description
  if (context.task.notes) {
    text += `\n[source: task-description | title: "Task Description"]\n`;
    text += context.task.notes;
    text += "\n[/source]\n";
  }

  // Linked deal
  if (context.deal) {
    text += `\n=== LINKED DEAL ===\n`;
    text += `[source: deal | id: ${context.deal.id} | title: "${context.deal.title}" | url: /deals/${context.deal.id}]\n`;
    text += `"${context.deal.title}" | $${context.deal.value.toLocaleString()} ${context.deal.currency} | Stage: ${context.deal.stage}`;
    if (context.deal.priority) text += ` | Priority: ${context.deal.priority}`;
    if (context.deal.expected_close_date)
      text += ` | Expected Close: ${context.deal.expected_close_date}`;
    text += "\n";
    if (context.deal.company)
      text += `Company: ${context.deal.company.company_name}${context.deal.company.industry ? ` (${context.deal.company.industry})` : ""}\n`;
    if (context.deal.source) text += `Source: ${context.deal.source}\n`;
    if (context.deal.description)
      text += `Description: ${context.deal.description}\n`;
    if (context.deal.next_step)
      text += `Next Step: ${context.deal.next_step}\n`;
    text += "[/source]\n";
  }

  // Linked contact
  if (context.contact) {
    text += `\n=== LINKED CONTACT ===\n`;
    text += `[source: contact | id: ${context.contact.id} | title: "${context.contact.first_name} ${context.contact.last_name}" | url: /contacts/${context.contact.id}]\n`;
    text += `${context.contact.first_name} ${context.contact.last_name}`;
    if (context.contact.email) text += ` <${context.contact.email}>`;
    text += "\n";
    if (context.contact.job_title) {
      text += context.contact.job_title;
      if (context.contact.company)
        text += ` at ${context.contact.company.company_name}`;
      text += "\n";
    }
    if (context.contact.phone) text += `Phone: ${context.contact.phone}\n`;
    text += "[/source]\n";
  }

  // Deal notes
  if (context.dealNotes.length > 0) {
    text += `\n=== DEAL NOTES (${context.dealNotes.length}) ===\n`;
    for (const note of context.dealNotes) {
      const title = note.title || "Untitled Note";
      const date = note.created_at.slice(0, 10);
      const author = note.author?.full_name || "Unknown";
      text += `\n[source: note | id: ${note.id} | title: "${title}" | date: ${date} | author: ${author} | url: /notes/${note.id}]\n`;
      // Truncate to 2000 chars per note to stay within context limits
      const content =
        note.plain_text.length > 2000
          ? note.plain_text.slice(0, 2000) + "..."
          : note.plain_text;
      text += content;
      text += "\n[/source]\n";
    }
  }

  // Contact notes (exclude duplicates already shown in deal notes)
  const dealNoteIds = new Set(context.dealNotes.map((n) => n.id));
  const uniqueContactNotes = context.contactNotes.filter(
    (n) => !dealNoteIds.has(n.id)
  );
  if (uniqueContactNotes.length > 0) {
    text += `\n=== CONTACT NOTES (${uniqueContactNotes.length}) ===\n`;
    for (const note of uniqueContactNotes) {
      const title = note.title || "Untitled Note";
      const date = note.created_at.slice(0, 10);
      text += `\n[source: note | id: ${note.id} | title: "${title}" | date: ${date} | url: /notes/${note.id}]\n`;
      const content =
        note.plain_text.length > 2000
          ? note.plain_text.slice(0, 2000) + "..."
          : note.plain_text;
      text += content;
      text += "\n[/source]\n";
    }
  }

  // Meeting transcripts
  if (context.dealTranscripts.length > 0) {
    text += `\n=== MEETING TRANSCRIPTS (${context.dealTranscripts.length}) ===\n`;
    for (const transcript of context.dealTranscripts) {
      const date = transcript.created_at.slice(0, 10);
      text += `\n[source: transcript | id: ${transcript.id} | title: "${transcript.title}" | date: ${date} | url: /deals/${transcript.deal_id}?tab=transcripts]\n`;
      // Truncate to 3000 chars per transcript
      const content =
        transcript.transcript_text.length > 3000
          ? transcript.transcript_text.slice(0, 3000) + "..."
          : transcript.transcript_text;
      text += content;
      text += "\n[/source]\n";
    }
  }

  // Knowledge Base Documents
  if (context.dealKBDocuments.length > 0) {
    text += `\n=== KNOWLEDGE BASE DOCUMENTS (${context.dealKBDocuments.length}) ===\n`;
    for (const doc of context.dealKBDocuments) {
      const date = doc.created_at.slice(0, 10);
      const categoryLabel = doc.category ? ` | category: ${doc.category}` : "";
      const dealId = context.deal?.id || "";
      text += `\n[source: kb-document | id: ${doc.id} | title: "${doc.original_filename}"${categoryLabel} | date: ${date} | url: /deals/${dealId}?tab=files]\n`;
      // Truncate to 5000 chars per KB document (richer than notes/transcripts)
      const content =
        doc.extracted_text.length > 5000
          ? doc.extracted_text.slice(0, 5000) + "..."
          : doc.extracted_text;
      text += content;
      text += "\n[/source]\n";
    }
  }

  // Recent activities
  if (context.recentActivities.length > 0) {
    text += `\n=== RECENT ACTIVITIES (${context.recentActivities.length}) ===\n`;
    for (const activity of context.recentActivities) {
      const date = activity.created_at.slice(0, 10);
      const meta = activity.metadata;
      const label = (meta?.title as string) || (meta?.name as string) || "";
      text += `- [${date}] ${activity.activity_type}${label ? `: ${label}` : ""}\n`;
    }
  }

  return text;
}
