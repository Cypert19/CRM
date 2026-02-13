-- Migration: Add revenue tracking with start/end dates and monthly line items
-- Enables retroactive monthly revenue recognition with per-month amendments.

-- 1. Add revenue date fields to deals
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS revenue_start_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS revenue_end_date date DEFAULT NULL;

-- 2. Create deal_revenue_items table for monthly amendments
CREATE TABLE IF NOT EXISTS deal_revenue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  month date NOT NULL,  -- Always first-of-month, e.g. '2025-03-01'
  item_type text NOT NULL CHECK (item_type IN ('retainer', 'audit_fee', 'custom_dev_fee')),
  amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- One entry per deal per month per item_type
  UNIQUE (deal_id, month, item_type)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_items_deal ON deal_revenue_items(deal_id);
CREATE INDEX IF NOT EXISTS idx_revenue_items_workspace_month ON deal_revenue_items(workspace_id, month);

-- 4. RLS
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

-- 5. Updated_at trigger
CREATE TRIGGER set_updated_at_revenue_items
  BEFORE UPDATE ON deal_revenue_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
