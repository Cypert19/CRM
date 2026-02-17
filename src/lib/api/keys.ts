import crypto from "crypto";

const KEY_PREFIX = "nxk_";

/**
 * Generate a new API key with its hash and prefix.
 * The raw key is shown once at creation time and never stored.
 */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const randomBytes = crypto.randomBytes(36);
  const randomPart = randomBytes.toString("base64url").slice(0, 48);
  const raw = `${KEY_PREFIX}${randomPart}`;
  const hash = hashApiKey(raw);
  const prefix = `${KEY_PREFIX}${randomPart.slice(0, 8)}`;
  return { raw, hash, prefix };
}

/**
 * Hash an API key using SHA-256 for secure storage and lookup.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}
