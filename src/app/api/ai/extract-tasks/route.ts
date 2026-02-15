import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/ai/client";
import { TRANSCRIPT_EXTRACT_TASKS_PROMPT } from "@/lib/ai/transcript-prompt";
import { extractJSON, attemptJSONRepair } from "@/lib/ai/json-utils";

export const runtime = "nodejs";
export const maxDuration = 300; // transcripts can be long

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transcript, dealTitle } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Transcript text is required" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    const anthropic = getAnthropicClient();

    // Use streaming SDK to keep the HTTP connection alive and prevent
    // Vercel proxy timeout (same fix applied to the import parse route).
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: TRANSCRIPT_EXTRACT_TASKS_PROMPT,
      messages: [
        {
          role: "user",
          content: `Today's date is ${today}.${dealTitle ? ` This meeting is about the deal: "${dealTitle}".` : ""}\n\nMeeting Transcript:\n\n${transcript}`,
        },
      ],
    });
    const response = await stream.finalMessage();

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No text response from AI" },
        { status: 500 }
      );
    }

    const rawText = textContent.text;

    // Parse JSON robustly
    let parsed;
    try {
      const jsonStr = extractJSON(rawText);
      parsed = JSON.parse(jsonStr);
    } catch {
      // Try repairing truncated JSON
      try {
        const jsonStr = extractJSON(rawText);
        const repaired = attemptJSONRepair(jsonStr);
        parsed = JSON.parse(repaired);
      } catch {
        console.error("[extract-tasks] Failed to parse AI response:", rawText.slice(0, 500));
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        );
      }
    }

    // Validate structure
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const summary = typeof parsed.summary === "string" ? parsed.summary : "";

    // Normalize tasks with client-side IDs
    const VALID_TASK_TYPES = ["Call", "Email", "Meeting", "Follow-Up", "Demo", "Proposal", "Automations", "Website Development", "Custom Development", "Training", "Consulting", "Other"];

    // Default due date: 7 days from today (when AI doesn't detect a specific date)
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 7);
    const defaultDueStr = defaultDue.toISOString().split("T")[0];

    const normalizedTasks = tasks.map((t: Record<string, unknown>, idx: number) => ({
      id: `draft-${Date.now()}-${idx}`,
      title: typeof t.title === "string" ? t.title : `Task ${idx + 1}`,
      task_type: VALID_TASK_TYPES.includes(t.task_type as string)
        ? t.task_type
        : "Other",
      priority: ["Low", "Medium", "High", "Urgent"].includes(t.priority as string)
        ? t.priority
        : "Medium",
      due_date: typeof t.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.due_date) ? t.due_date : defaultDueStr,
      notes: typeof t.notes === "string" ? t.notes : "No additional context provided.",
      assignee_id: null,
      confirmed: false,
    }));

    return NextResponse.json({
      tasks: normalizedTasks,
      summary,
    });
  } catch (error) {
    console.error("[extract-tasks] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
