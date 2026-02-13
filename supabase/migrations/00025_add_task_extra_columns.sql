-- Migration: Add missing task columns
-- These columns are referenced in types/database.ts and validators/tasks.ts
-- but were never added to the actual database schema.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS category text DEFAULT NULL
    CHECK (category IN ('deal', 'personal', 'workshop', 'other')),
  ADD COLUMN IF NOT EXISTS start_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS end_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS actual_minutes integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS focus_started_at timestamptz DEFAULT NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
