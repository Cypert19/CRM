/**
 * Robustly extract JSON from AI response text.
 * Handles markdown code fences, leading/trailing text, etc.
 */
export function extractJSON(text: string): string {
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

/**
 * Attempt to repair truncated JSON (unclosed strings, brackets, braces).
 */
export function attemptJSONRepair(jsonStr: string): string {
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
