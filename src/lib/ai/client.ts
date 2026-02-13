import Anthropic from "@anthropic-ai/sdk";

/**
 * Reads the ANTHROPIC_API_KEY from environment variables.
 * In production (Vercel), process.env works directly.
 * In dev with Turbopack, falls back to parsing .env.local.
 */
function getApiKey(): string {
  // Works in production / Vercel / webpack builds
  const envKey = process.env["ANTHROPIC_API_KEY"];
  if (envKey) {
    return envKey;
  }

  // Dev-only fallback: read .env.local directly (Turbopack workaround)
  if (process.env.NODE_ENV === "development") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("path");
      const envPath = path.join(process.cwd(), ".env.local");
      const envFile = fs.readFileSync(envPath, "utf-8");
      const match = envFile.match(/^ANTHROPIC_API_KEY=(.+)$/m);
      if (match && match[1]) {
        return match[1].trim();
      }
    } catch {
      // .env.local not found or unreadable
    }
  }

  throw new Error(
    "ANTHROPIC_API_KEY is not set. Add it to .env.local or set it in your environment."
  );
}

export function getAnthropicClient(): Anthropic {
  const apiKey = getApiKey();
  return new Anthropic({ apiKey });
}
