-- Migration: Create email tables for CRM email correspondence
-- Tables: email_templates, email_logs, email_events

-- ============================================================
-- email_templates: Reusable email templates
-- ============================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text NOT NULL DEFAULT '',

  variables text[] DEFAULT '{}',
  category text DEFAULT 'general'
    CHECK (category IN ('general', 'follow_up', 'introduction', 'proposal', 'closing', 'other')),

  is_default boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- email_logs: Every email sent from the CRM
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Sender (CRM user)
  sender_id uuid NOT NULL REFERENCES users(id),
  from_email text NOT NULL,
  from_name text NOT NULL,

  -- Recipients
  to_emails text[] NOT NULL,
  cc_emails text[] DEFAULT '{}',
  bcc_emails text[] DEFAULT '{}',

  -- Content
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text NOT NULL DEFAULT '',

  -- CRM entity associations
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,

  -- Email provider
  external_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'delivered', 'bounced', 'failed')),
  error_message text,

  -- Template reference
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,

  -- Tracking summary (denormalized from email_events for fast reads)
  opened_at timestamptz,
  clicked_at timestamptz,
  open_count int DEFAULT 0,
  click_count int DEFAULT 0,

  -- Thread support (for future reply tracking)
  thread_id text,
  in_reply_to uuid REFERENCES email_logs(id) ON DELETE SET NULL,
  direction text NOT NULL DEFAULT 'outbound'
    CHECK (direction IN ('outbound', 'inbound')),

  -- Metadata
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,

  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- email_events: Webhook tracking events (opens, clicks, bounces)
-- ============================================================
CREATE TABLE IF NOT EXISTS email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email_log_id uuid NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,

  event_type text NOT NULL
    CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'delivery_delayed')),

  timestamp timestamptz NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,

  -- Click-specific
  link_url text,

  -- Bounce-specific
  bounce_type text,

  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_email_templates_workspace ON email_templates(workspace_id);

CREATE INDEX idx_email_logs_workspace ON email_logs(workspace_id);
CREATE INDEX idx_email_logs_contact ON email_logs(contact_id);
CREATE INDEX idx_email_logs_deal ON email_logs(deal_id);
CREATE INDEX idx_email_logs_company ON email_logs(company_id);
CREATE INDEX idx_email_logs_sender ON email_logs(sender_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_external_id ON email_logs(external_id);
CREATE INDEX idx_email_logs_thread ON email_logs(thread_id);
CREATE INDEX idx_email_logs_created ON email_logs(created_at DESC);

CREATE INDEX idx_email_events_email_log ON email_events(email_log_id);
CREATE INDEX idx_email_events_workspace ON email_events(workspace_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- email_templates RLS
CREATE POLICY "Users can view templates in their workspace"
  ON email_templates FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE POLICY "Users can insert templates in their workspace"
  ON email_templates FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE POLICY "Users can update templates in their workspace"
  ON email_templates FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE POLICY "Users can delete templates in their workspace"
  ON email_templates FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

-- email_logs RLS
CREATE POLICY "Users can view emails in their workspace"
  ON email_logs FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE POLICY "Users can insert emails in their workspace"
  ON email_logs FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE POLICY "Users can update emails in their workspace"
  ON email_logs FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

-- email_events RLS
CREATE POLICY "Users can view email events in their workspace"
  ON email_events FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE POLICY "Service role can insert email events"
  ON email_events FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Updated_at triggers
-- ============================================================
CREATE TRIGGER set_updated_at_email_templates
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_email_logs
  BEFORE UPDATE ON email_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
