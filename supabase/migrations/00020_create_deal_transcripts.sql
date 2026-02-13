-- Migration: Create deal_transcripts table for meeting transcript AI task extraction
-- Stores pasted meeting transcripts with AI-extracted tasks as JSON draft data.

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deal_transcripts_deal ON deal_transcripts(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_transcripts_workspace ON deal_transcripts(workspace_id);

-- RLS
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

-- Updated_at trigger
CREATE TRIGGER set_updated_at_deal_transcripts
  BEFORE UPDATE ON deal_transcripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
