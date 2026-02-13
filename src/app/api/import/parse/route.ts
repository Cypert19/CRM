import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/ai/client";
import { buildImportSystemPrompt, buildImportUserPrompt } from "@/lib/ai/import-prompt";
import { getPipelines } from "@/actions/pipelines";

export const runtime = "nodejs";
export const maxDuration = 90;

const MAX_CONTENT_LENGTH = 200_000; // ~200K chars
const MAX_ROWS_BEFORE_TRUNCATION = 500;
const TRUNCATION_THRESHOLD = 150_000; // chars

// ─── Helper: Preprocess raw file content ──────────────────────────────────────

function preprocessContent(
  content: string,
  fileType: string
): { cleaned: string; detectedHeaders: string | null; wasTruncated: boolean } {
  let cleaned = content;
  let detectedHeaders: string | null = null;
  let wasTruncated = false;

  // Strip UTF-8 BOM
  cleaned = cleaned.replace(/^\uFEFF/, "");

  // Normalize line endings
  cleaned = cleaned.replace(/\r\n?/g, "\n");

  // Trim trailing empty lines
  cleaned = cleaned.replace(/\n+$/, "\n");

  // CSV-specific preprocessing
  if (fileType === "csv") {
    const lines = cleaned.split("\n");

    // Detect header row (first non-empty line)
    const headerIndex = lines.findIndex((line) => line.trim().length > 0);
    if (headerIndex >= 0) {
      detectedHeaders = lines[headerIndex].trim();
    }

    // Truncate very large CSVs to first N data rows
    if (cleaned.length > TRUNCATION_THRESHOLD) {
      const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
      if (nonEmptyLines.length > MAX_ROWS_BEFORE_TRUNCATION + 1) {
        // Keep header + first N rows
        const kept = nonEmptyLines.slice(0, MAX_ROWS_BEFORE_TRUNCATION + 1);
        cleaned = kept.join("\n") + "\n";
        wasTruncated = true;
        console.warn(
          `[import] Content truncated from ${nonEmptyLines.length} to ${MAX_ROWS_BEFORE_TRUNCATION + 1} lines (${content.length} → ${cleaned.length} chars)`
        );
      }
    }
  }

  return { cleaned, detectedHeaders, wasTruncated };
}

// ─── Helper: Robustly extract JSON from AI response ───────────────────────────

function extractJSON(text: string): string {
  let str = text.trim();

  // Try to extract content from markdown code fences anywhere in the string
  const fenceMatch = str.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    str = fenceMatch[1].trim();
  }

  // Find the first { and last } to extract the JSON object
  const firstBrace = str.indexOf("{");
  const lastBrace = str.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return str.slice(firstBrace, lastBrace + 1);
  }

  // Fallback: return as-is (will fail at JSON.parse, handled by caller)
  return str;
}

// ─── Helper: Attempt to repair truncated JSON ─────────────────────────────────

function attemptJSONRepair(jsonStr: string): string {
  let repaired = jsonStr;

  // Count open/close braces and brackets
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (const char of repaired) {
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{") openBraces++;
    else if (char === "}") openBraces--;
    else if (char === "[") openBrackets++;
    else if (char === "]") openBrackets--;
  }

  // If we're in a string, close it
  if (inString) {
    repaired += '"';
  }

  // Close any open brackets and braces
  while (openBrackets > 0) {
    repaired += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    repaired += "}";
    openBraces--;
  }

  return repaired;
}

// ─── Helper: Coerce and normalize the AI parse result ─────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function coerceParseResult(parsed: any): Record<string, unknown> | null {
  if (typeof parsed !== "object" || parsed === null) return null;

  // Unwrap { data: { ... } } wrapper pattern
  let target = parsed;
  if (
    target.data &&
    typeof target.data === "object" &&
    !Array.isArray(target.data) &&
    (target.data.companies || target.data.contacts || target.data.deals)
  ) {
    target = target.data;
  }

  const entityKeys = ["companies", "contacts", "deals", "notes", "tasks"] as const;

  // Coerce non-array entity fields to arrays
  for (const key of entityKeys) {
    const val = target[key];
    if (Array.isArray(val)) {
      // Already an array — keep as-is
    } else if (val && typeof val === "object") {
      // Object — convert to array via Object.values()
      target[key] = Object.values(val);
    } else {
      // null, undefined, or non-object — default to empty array
      target[key] = [];
    }
  }

  // Check at least one entity array is non-empty
  const hasEntities = entityKeys.some(
    (key) => Array.isArray(target[key]) && target[key].length > 0
  );

  if (!hasEntities) {
    return null;
  }

  return target;
}

// ─── Stream Claude and collect full text ──────────────────────────────────────

async function streamClaude(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  anthropic: any,
  systemPrompt: string,
  userPrompt: string,
  onChunk?: () => void
): Promise<{ text: string; stopReason: string | null }> {
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16384,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  // Register text handler for keepalive signaling
  stream.on("text", () => {
    onChunk?.();
  });

  // Wait for the full message to complete
  const finalMessage = await stream.finalMessage();

  const textBlock = finalMessage.content.find(
    (block: { type: string }) => block.type === "text"
  );
  const fullText = textBlock ? (textBlock as { type: "text"; text: string }).text : "";
  const stopReason = finalMessage.stop_reason || null;

  return { text: fullText, stopReason };
}

// ─── Process Claude text into parsed result ──────────────────────────────────

type ParseAttemptResult = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any> | null;
  error: string | null;
  stopReason: string | null;
};

function processClaudeText(text: string, stopReason: string | null): ParseAttemptResult {
  if (stopReason === "max_tokens") {
    console.warn("[import] AI response was truncated (hit max_tokens)");
  }

  const rawResponsePreview = text.substring(0, 500);
  console.log("[import] AI response preview:", rawResponsePreview);
  console.log("[import] AI response length:", text.length, "chars, stop_reason:", stopReason);

  // Extract JSON robustly
  let jsonStr = extractJSON(text);

  // If response was truncated, attempt bracket-closing repair
  if (stopReason === "max_tokens") {
    console.warn("[import] Attempting JSON repair for truncated response");
    jsonStr = attemptJSONRepair(jsonStr);
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseError) {
    const errMsg = parseError instanceof Error ? parseError.message : String(parseError);
    console.error("[import] JSON parse failed:", errMsg);
    console.error("[import] JSON input preview:", jsonStr.substring(0, 300));
    return { data: null, error: `JSON parse failed: ${errMsg}`, stopReason };
  }

  // Coerce and validate
  const coerced = coerceParseResult(parsed);
  if (!coerced) {
    console.warn("[import] Coerced result was null/empty. Keys found:", Object.keys(parsed as object));
    return { data: null, error: "AI response did not contain recognizable entity data", stopReason };
  }

  return { data: coerced, error: null, stopReason };
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { content, fileType, fileName } = body as {
      content: string;
      fileType: string;
      fileName: string;
    };

    if (!content || !fileType || !fileName) {
      return new Response(
        JSON.stringify({ error: "content, fileType, and fileName are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Content size guard
    if (content.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `File content is too large (${Math.round(content.length / 1000)}K chars). Maximum is ${MAX_CONTENT_LENGTH / 1000}K characters. Try a smaller file or export fewer records.`,
        }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }

    // Preprocess content
    const { cleaned, detectedHeaders, wasTruncated } = preprocessContent(content, fileType);

    if (detectedHeaders) {
      console.log("[import] Detected CSV headers:", detectedHeaders);
    }
    if (wasTruncated) {
      console.warn("[import] CSV was truncated to first", MAX_ROWS_BEFORE_TRUNCATION, "rows");
    }

    // Fetch workspace pipeline stages for stage mapping
    const pipelinesResult = await getPipelines();
    const stages: { id: string; name: string; pipeline_id: string }[] = [];
    if (pipelinesResult.success && pipelinesResult.data) {
      for (const pipeline of pipelinesResult.data) {
        for (const stage of pipeline.pipeline_stages || []) {
          stages.push({
            id: stage.id,
            name: stage.name,
            pipeline_id: stage.pipeline_id,
          });
        }
      }
    }

    const systemPrompt = buildImportSystemPrompt(stages);
    const userPrompt = buildImportUserPrompt(cleaned, fileType, fileName);
    const anthropic = getAnthropicClient();

    // Use a streaming response to prevent Vercel proxy 504 (time-to-first-byte).
    // We stream whitespace keepalives while Claude generates, then flush the
    // final JSON result at the end.
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // Send keepalive spaces while waiting for Claude
        const keepaliveInterval = setInterval(() => {
          controller.enqueue(encoder.encode(" "));
        }, 3000);

        try {
          // First attempt — stream from Claude
          console.log("[import] Starting first parse attempt for:", fileName);
          const firstResult = await streamClaude(anthropic, systemPrompt, userPrompt, () => {
            // Each chunk from Claude also acts as proof of life
          });
          let attempt = processClaudeText(firstResult.text, firstResult.stopReason);

          // Retry once if parsing failed
          if (!attempt.data) {
            console.warn("[import] First attempt failed:", attempt.error);

            let retryHint: string;
            if (attempt.stopReason === "max_tokens") {
              retryHint =
                "CRITICAL: Your previous response was truncated because it was too long. You MUST produce shorter output. Focus on the most important entities only. Limit to the first 50 rows of data if needed. Return ONLY valid JSON.";
            } else if (attempt.error?.includes("JSON parse")) {
              retryHint =
                "CRITICAL: Your previous response was not valid JSON. Return ONLY the raw JSON object. Start your response with { and end with }. No markdown code fences, no explanatory text.";
            } else {
              retryHint =
                "IMPORTANT: You must return ONLY valid JSON. No markdown, no code fences, no explanatory text. Start with { and end with }. Just the raw JSON object.";
            }

            const retryUserPrompt = `${userPrompt}\n\n${retryHint}`;
            console.log("[import] Starting retry attempt");
            const secondResult = await streamClaude(anthropic, systemPrompt, retryUserPrompt);
            const secondAttempt = processClaudeText(secondResult.text, secondResult.stopReason);

            if (!secondAttempt.data) {
              console.error("[import] Both attempts failed. First:", attempt.error, "| Second:", secondAttempt.error);
              clearInterval(keepaliveInterval);

              const errorPayload = JSON.stringify({
                error:
                  "Unable to parse this file format. The AI could not extract structured data. Try exporting your CRM data as CSV with clear column headers.",
                details: {
                  firstAttemptError: attempt.error,
                  retryError: secondAttempt.error,
                  detectedHeaders,
                  wasTruncated,
                  stopReason: secondAttempt.stopReason || attempt.stopReason,
                },
              });
              controller.enqueue(encoder.encode(errorPayload));
              controller.close();
              return;
            }

            attempt = secondAttempt;
          }

          clearInterval(keepaliveInterval);

          // Build final result
          const parsedResult = attempt.data!;
          const result = {
            companies: Array.isArray(parsedResult.companies) ? parsedResult.companies : [],
            contacts: Array.isArray(parsedResult.contacts) ? parsedResult.contacts : [],
            deals: Array.isArray(parsedResult.deals) ? parsedResult.deals : [],
            notes: Array.isArray(parsedResult.notes) ? parsedResult.notes : [],
            tasks: Array.isArray(parsedResult.tasks) ? parsedResult.tasks : [],
            stageMappings: parsedResult.stageMappings || {},
            warnings: parsedResult.warnings || [],
            summary: parsedResult.summary || "Import data parsed",
          };

          console.log(
            "[import] Parse success:",
            result.companies.length, "companies,",
            result.contacts.length, "contacts,",
            result.deals.length, "deals,",
            result.notes.length, "notes,",
            result.tasks.length, "tasks"
          );

          controller.enqueue(encoder.encode(JSON.stringify(result)));
          controller.close();
        } catch (error) {
          clearInterval(keepaliveInterval);
          console.error("[import] Parse route error:", error);
          controller.enqueue(
            encoder.encode(JSON.stringify({ error: "Internal server error during import parsing" }))
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[import] Parse route error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error during import parsing" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
