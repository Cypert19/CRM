-- Add Knowledge Base columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE files ADD COLUMN IF NOT EXISTS extracted_text text;

-- Index for efficient KB queries filtered by deal + category
CREATE INDEX IF NOT EXISTS idx_files_deal_category ON files (deal_id, category) WHERE deal_id IS NOT NULL;

-- Documentation
COMMENT ON COLUMN files.category IS 'User-defined knowledge base category (e.g., Audit Data, Technical Stack, Training, Employee Database)';
COMMENT ON COLUMN files.extracted_text IS 'Text content extracted from uploaded documents for AI context injection';
