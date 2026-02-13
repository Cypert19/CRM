-- ============================================================
-- NexusCRM Production Setup - Step 2
-- ============================================================
-- Run this AFTER production-setup.sql completes successfully.
--
-- This is separate because ALTER TYPE ... ADD VALUE cannot run
-- inside a multi-statement transaction in PostgreSQL.
-- ============================================================

-- ─── Migration 21: Additional Task Types ───
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Automations';
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Website Development';
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Custom Development';
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Training';
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Consulting';
