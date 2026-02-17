-- Migration: Create api_keys table for REST API authentication

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- The key itself (stored as SHA-256 hash, never plaintext)
  key_prefix text NOT NULL,         -- First 12 chars of key for identification: "nxk_abc1..."
  key_hash text NOT NULL,           -- SHA-256 hash of the full key

  -- Metadata
  name text NOT NULL,               -- Human-readable name, e.g. "Manus Agent"
  description text,

  -- Permissions (simple approach: full access per workspace)
  permissions text[] DEFAULT '{all}',

  -- Audit
  created_by uuid NOT NULL REFERENCES users(id),
  last_used_at timestamptz,
  expires_at timestamptz,           -- NULL = never expires
  is_revoked boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage API keys"
  ON api_keys FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'Active' AND role = 'Admin'
  ));

-- Updated_at trigger
CREATE TRIGGER set_updated_at_api_keys
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
