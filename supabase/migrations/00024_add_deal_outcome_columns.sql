-- Migration: Add remaining missing deal columns
-- win_reason, lost_reason, closed_at, and custom_fields were in the
-- TypeScript types but never added to the actual database.

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS win_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lost_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
