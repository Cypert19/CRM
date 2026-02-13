/** A single task extracted by AI from a meeting transcript */
export type DraftTask = {
  id: string; // client-side UUID for keying
  title: string;
  task_type: "Call" | "Email" | "Meeting" | "Follow-Up" | "Demo" | "Proposal" | "Automations" | "Website Development" | "Custom Development" | "Training" | "Consulting" | "Other";
  priority: "Low" | "Medium" | "High" | "Urgent";
  due_date: string | null; // YYYY-MM-DD or null
  notes: string | null;
  assignee_id: string | null; // null = unassigned (user picks)
  confirmed: boolean; // has the user confirmed/created this task?
};

/** Shape of the AI response from /api/ai/extract-tasks */
export type ExtractTasksResponse = {
  tasks: DraftTask[];
  summary: string; // brief meeting summary
};

/** Transcript with its creator info */
export type TranscriptWithCreator = {
  id: string;
  workspace_id: string;
  deal_id: string;
  title: string;
  transcript_text: string;
  ai_extracted_tasks: DraftTask[];
  status: "pending" | "processing" | "completed" | "failed";
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: { id: string; full_name: string; avatar_url: string | null } | null;
};
