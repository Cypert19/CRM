-- ============================================================
-- NexusCRM Production Database Setup
-- ============================================================
-- Run this ENTIRE file in the Supabase SQL Editor for your new
-- production project. It includes:
--   1. Base schema (tables, enums, indexes, triggers, storage)
--   2. All 6 migrations (00017–00022)
--
-- IMPORTANT: Run this as a SINGLE query. Do NOT split it up,
-- except for Migration 21 (ALTER TYPE) which must run separately.
-- ============================================================


-- =====================
-- PART 1: BASE SCHEMA
-- =====================

-- ─── ENUMS ───
CREATE TYPE user_role AS ENUM ('Admin', 'Manager', 'Member');
CREATE TYPE member_status AS ENUM ('Active', 'Invited', 'Deactivated');
CREATE TYPE deal_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE deal_source AS ENUM ('Inbound', 'Outbound', 'Referral', 'Partner', 'Event', 'Website', 'Other');
CREATE TYPE lifecycle_stage AS ENUM ('Lead', 'Marketing Qualified', 'Sales Qualified', 'Opportunity', 'Customer', 'Evangelist', 'Other');
CREATE TYPE contact_role AS ENUM ('Decision Maker', 'Champion', 'Influencer', 'Blocker', 'End User');
CREATE TYPE task_status AS ENUM ('To Do', 'In Progress', 'Done', 'Cancelled');
CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE task_type AS ENUM ('Call', 'Email', 'Meeting', 'Follow-Up', 'Demo', 'Proposal', 'Other');
CREATE TYPE activity_type AS ENUM ('deal_created', 'deal_updated', 'deal_stage_changed', 'deal_won', 'deal_lost', 'contact_created', 'contact_updated', 'company_created', 'company_updated', 'note_created', 'task_created', 'task_completed', 'file_uploaded', 'file_deleted', 'email_logged', 'call_logged', 'meeting_logged');
CREATE TYPE custom_field_type AS ENUM ('Text', 'Long Text', 'Number', 'Currency', 'Date', 'DateTime', 'Single Select', 'Multi Select', 'Checkbox', 'URL', 'Email', 'Phone', 'User', 'Rating');
CREATE TYPE custom_field_entity AS ENUM ('Deal', 'Contact', 'Company');
CREATE TYPE notification_channel AS ENUM ('realtime', 'daily', 'weekly', 'off');

-- ─── TABLES ───

-- 1. Workspaces
CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  default_currency text NOT NULL DEFAULT 'USD',
  default_timezone text NOT NULL DEFAULT 'America/New_York',
  fiscal_year_start_month integer NOT NULL DEFAULT 1,
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Users
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Workspace Members
CREATE TABLE workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'Member',
  status member_status NOT NULL DEFAULT 'Active',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- 4. Pipelines
CREATE TABLE pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Pipeline Stages
CREATE TABLE pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  display_order integer NOT NULL DEFAULT 0,
  default_probability integer NOT NULL DEFAULT 0,
  is_won boolean NOT NULL DEFAULT false,
  is_lost boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Companies
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  domain text,
  industry text,
  employee_count_range text,
  annual_revenue_range text,
  address jsonb,
  phone text,
  website text,
  description text,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  custom_fields jsonb NOT NULL DEFAULT '{}',
  deleted_at timestamptz,
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Contacts
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  job_title text,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  lifecycle_stage lifecycle_stage,
  source deal_source,
  address jsonb,
  social_profiles jsonb NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  last_contacted_at timestamptz,
  custom_fields jsonb NOT NULL DEFAULT '{}',
  avatar_url text,
  deleted_at timestamptz,
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Deals
CREATE TABLE deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  stage_id uuid NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  expected_close_date date,
  probability integer CHECK (probability >= 0 AND probability <= 100),
  priority deal_priority,
  source deal_source,
  tags text[] NOT NULL DEFAULT '{}',
  description text,
  lost_reason text,
  custom_fields jsonb NOT NULL DEFAULT '{}',
  deleted_at timestamptz,
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Deal Contacts (many-to-many)
CREATE TABLE deal_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role contact_role,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deal_id, contact_id)
);

-- 10. Notes
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text,
  content jsonb NOT NULL DEFAULT '{}',
  plain_text text NOT NULL DEFAULT '',
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  ai_summary text,
  ai_action_items jsonb NOT NULL DEFAULT '[]',
  tags text[] NOT NULL DEFAULT '{}',
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Tasks
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  status task_status NOT NULL DEFAULT 'To Do',
  priority task_priority NOT NULL DEFAULT 'Medium',
  due_date date,
  due_time time,
  assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  task_type task_type,
  reminder_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 12. Files
CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  original_filename text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes bigint NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 13. Activities
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  actor_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 14. Custom Field Definitions
CREATE TABLE custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_type custom_field_entity NOT NULL,
  field_name text NOT NULL,
  field_key text NOT NULL,
  field_type custom_field_type NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  default_value jsonb,
  options jsonb NOT NULL DEFAULT '[]',
  display_order integer NOT NULL DEFAULT 0,
  pipeline_id uuid REFERENCES pipelines(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, entity_type, field_key)
);

-- 15. Notification Preferences
CREATE TABLE notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_assigned notification_channel NOT NULL DEFAULT 'realtime',
  stage_changed notification_channel NOT NULL DEFAULT 'realtime',
  task_assigned notification_channel NOT NULL DEFAULT 'realtime',
  task_due_soon notification_channel NOT NULL DEFAULT 'realtime',
  task_overdue notification_channel NOT NULL DEFAULT 'realtime',
  mention_in_note notification_channel NOT NULL DEFAULT 'realtime',
  new_note_on_deal notification_channel NOT NULL DEFAULT 'realtime',
  ai_insight notification_channel NOT NULL DEFAULT 'daily',
  weekly_summary notification_channel NOT NULL DEFAULT 'weekly',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- ─── INDEXES ───
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_pipelines_workspace ON pipelines(workspace_id);
CREATE INDEX idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX idx_deals_workspace ON deals(workspace_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_deleted ON deals(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_deleted ON contacts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_workspace ON companies(workspace_id);
CREATE INDEX idx_companies_deleted ON companies(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_workspace ON notes(workspace_id);
CREATE INDEX idx_notes_author ON notes(author_id);
CREATE INDEX idx_notes_deal ON notes(deal_id);
CREATE INDEX idx_notes_contact ON notes(contact_id);
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_deal ON tasks(deal_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_activities_workspace ON activities(workspace_id);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
CREATE INDEX idx_files_workspace ON files(workspace_id);
CREATE INDEX idx_files_deal ON files(deal_id);

-- ─── TRIGGERS (updated_at) ───
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workspaces_updated BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_workspace_members_updated BEFORE UPDATE ON workspace_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pipelines_updated BEFORE UPDATE ON pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pipeline_stages_updated BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_custom_fields_updated BEFORE UPDATE ON custom_field_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_notification_prefs_updated BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── STORAGE BUCKET ───
INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', false) ON CONFLICT DO NOTHING;


-- =====================
-- PART 2: MIGRATIONS
-- =====================

-- ─── Migration 17: Custom Dashboards ───
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS custom_dashboards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'My Dashboard',
  description  TEXT,
  is_default   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_dashboards_workspace_user
  ON custom_dashboards(workspace_id, user_id);

ALTER TABLE custom_dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dashboards"
  ON custom_dashboards FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS dashboard_tiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id  UUID NOT NULL REFERENCES custom_dashboards(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT 'New Tile',
  tile_type     TEXT NOT NULL CHECK (tile_type IN ('kpi', 'chart', 'table')),
  grid_x        INT NOT NULL DEFAULT 0 CHECK (grid_x >= 0 AND grid_x < 12),
  grid_y        INT NOT NULL DEFAULT 0 CHECK (grid_y >= 0),
  grid_w        INT NOT NULL DEFAULT 3 CHECK (grid_w >= 1 AND grid_w <= 12),
  grid_h        INT NOT NULL DEFAULT 1 CHECK (grid_h >= 1 AND grid_h <= 4),
  display_order INT NOT NULL DEFAULT 0,
  config        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dashboard_tiles_dashboard ON dashboard_tiles(dashboard_id);
CREATE INDEX idx_dashboard_tiles_workspace ON dashboard_tiles(workspace_id);

ALTER TABLE dashboard_tiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tiles on own dashboards"
  ON dashboard_tiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_dashboards
      WHERE custom_dashboards.id = dashboard_tiles.dashboard_id
      AND custom_dashboards.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_dashboards
      WHERE custom_dashboards.id = dashboard_tiles.dashboard_id
      AND custom_dashboards.user_id = auth.uid()
    )
  );

CREATE TRIGGER set_custom_dashboards_updated_at
  BEFORE UPDATE ON custom_dashboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_dashboard_tiles_updated_at
  BEFORE UPDATE ON dashboard_tiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─── Migration 18: Revenue Split Columns ───
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS audit_fee numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS retainer_monthly numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS custom_dev_fee numeric DEFAULT 0 NOT NULL;

CREATE OR REPLACE FUNCTION compute_deal_total_value()
RETURNS TRIGGER AS $$
BEGIN
  NEW.value := COALESCE(NEW.audit_fee, 0) + COALESCE(NEW.retainer_monthly, 0) + COALESCE(NEW.custom_dev_fee, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_deal_total_value ON deals;
CREATE TRIGGER trg_compute_deal_total_value
  BEFORE INSERT OR UPDATE OF audit_fee, retainer_monthly, custom_dev_fee
  ON deals
  FOR EACH ROW
  EXECUTE FUNCTION compute_deal_total_value();


-- ─── Migration 19: Revenue Tracking ───
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS revenue_start_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS revenue_end_date date DEFAULT NULL;

CREATE TABLE IF NOT EXISTS deal_revenue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  month date NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('retainer', 'audit_fee', 'custom_dev_fee')),
  amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (deal_id, month, item_type)
);

CREATE INDEX IF NOT EXISTS idx_revenue_items_deal ON deal_revenue_items(deal_id);
CREATE INDEX IF NOT EXISTS idx_revenue_items_workspace_month ON deal_revenue_items(workspace_id, month);

ALTER TABLE deal_revenue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view revenue items in their workspace"
  ON deal_revenue_items FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE POLICY "Users can insert revenue items in their workspace"
  ON deal_revenue_items FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE POLICY "Users can update revenue items in their workspace"
  ON deal_revenue_items FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE POLICY "Users can delete revenue items in their workspace"
  ON deal_revenue_items FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE TRIGGER set_updated_at_revenue_items
  BEFORE UPDATE ON deal_revenue_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ─── Migration 20: Deal Transcripts ───
CREATE TABLE IF NOT EXISTS deal_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Transcript',
  transcript_text text NOT NULL,
  ai_extracted_tasks jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_transcripts_deal ON deal_transcripts(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_transcripts_workspace ON deal_transcripts(workspace_id);

ALTER TABLE deal_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transcripts in their workspace"
  ON deal_transcripts FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE POLICY "Users can insert transcripts in their workspace"
  ON deal_transcripts FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE POLICY "Users can update transcripts in their workspace"
  ON deal_transcripts FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE POLICY "Users can delete transcripts in their workspace"
  ON deal_transcripts FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'Active'
  ));

CREATE TRIGGER set_updated_at_deal_transcripts
  BEFORE UPDATE ON deal_transcripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ─── Migration 22: KB Columns on Files ───
ALTER TABLE files ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE files ADD COLUMN IF NOT EXISTS extracted_text text;

CREATE INDEX IF NOT EXISTS idx_files_deal_category ON files (deal_id, category) WHERE deal_id IS NOT NULL;

COMMENT ON COLUMN files.category IS 'User-defined knowledge base category (e.g., Audit Data, Technical Stack, Training, Employee Database)';
COMMENT ON COLUMN files.extracted_text IS 'Text content extracted from uploaded documents for AI context injection';
