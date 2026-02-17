/**
 * Bootstrap script to generate an API key for NexusCRM REST API.
 *
 * Usage:
 *   npx tsx scripts/generate-api-key.ts <workspace_id> <user_id> <key_name>
 *
 * Example:
 *   npx tsx scripts/generate-api-key.ts abc123-... def456-... "Manus Agent"
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (avoids dotenv dependency)
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env.local may not exist if env vars are set directly
}

const KEY_PREFIX = "nxk_";

function generateApiKey() {
  const randomBytes = crypto.randomBytes(36);
  const randomPart = randomBytes.toString("base64url").slice(0, 48);
  const raw = `${KEY_PREFIX}${randomPart}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const prefix = `${KEY_PREFIX}${randomPart.slice(0, 8)}`;
  return { raw, hash, prefix };
}

async function main() {
  const [, , workspaceId, userId, ...nameParts] = process.argv;
  const name = nameParts.join(" ");

  if (!workspaceId || !userId || !name) {
    console.error(
      'Usage: npx tsx scripts/generate-api-key.ts <workspace_id> <user_id> "<key_name>"'
    );
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify workspace exists
  const { data: workspace, error: wsError } = await admin
    .from("workspaces")
    .select("id, name")
    .eq("id", workspaceId)
    .single();

  if (wsError || !workspace) {
    console.error(`Workspace not found: ${workspaceId}`);
    process.exit(1);
  }

  // Verify user exists
  const { data: user, error: userError } = await admin
    .from("users")
    .select("id, full_name")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    console.error(`User not found: ${userId}`);
    process.exit(1);
  }

  const { raw, hash, prefix } = generateApiKey();

  const { error } = await admin.from("api_keys").insert({
    workspace_id: workspaceId,
    key_prefix: prefix,
    key_hash: hash,
    name,
    created_by: userId,
  });

  if (error) {
    console.error("Error creating API key:", error.message);
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║            API Key Generated Successfully         ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  console.log(`  Workspace:  ${workspace.name}`);
  console.log(`  Created by: ${user.full_name}`);
  console.log(`  Key name:   ${name}`);
  console.log(`  Prefix:     ${prefix}`);
  console.log(`\n  API Key:    ${raw}`);
  console.log(
    "\n  ⚠️  Save this key now — it cannot be retrieved later.\n"
  );
}

main();
