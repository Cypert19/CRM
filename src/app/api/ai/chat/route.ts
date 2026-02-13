import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/ai/client";
import { NEXUS_AI_SYSTEM_PROMPT, FOCUS_MODE_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { assembleContext } from "@/lib/ai/context";
import { getFocusTaskContext } from "@/actions/focus";
import { assembleTaskContext } from "@/lib/ai/focus-context";

export const runtime = "nodejs";
export const maxDuration = 60;

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

    const { messages, focusTaskId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages required" },
        { status: 400 }
      );
    }

    // Assemble context — focus mode uses deep task context, normal uses CRM context
    let systemPrompt: string;

    if (focusTaskId) {
      const taskCtx = await getFocusTaskContext(focusTaskId);
      if (taskCtx.success && taskCtx.data) {
        const taskContext = assembleTaskContext(taskCtx.data);
        systemPrompt = `${FOCUS_MODE_SYSTEM_PROMPT}\n\n${taskContext}`;
      } else {
        // Fallback to normal CRM context if task fetch fails
        const crmContext = await assembleContext();
        systemPrompt = `${NEXUS_AI_SYSTEM_PROMPT}\n\n${crmContext}`;
      }
    } else {
      const crmContext = await assembleContext();
      systemPrompt = `${NEXUS_AI_SYSTEM_PROMPT}\n\n${crmContext}`;
    }

    const anthropic = getAnthropicClient();

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map(
        (m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })
      ),
    });

    // Convert to ReadableStream for the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
