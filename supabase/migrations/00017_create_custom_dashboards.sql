-- ─── Custom Dashboards ───
-- Stores user-created dashboard layouts with configurable tiles

-- Updated-at trigger function (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Dashboard Container ───
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

-- ─── Dashboard Tiles ───
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

-- ─── Updated-at Triggers ───
CREATE TRIGGER set_custom_dashboards_updated_at
  BEFORE UPDATE ON custom_dashboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_dashboard_tiles_updated_at
  BEFORE UPDATE ON dashboard_tiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
