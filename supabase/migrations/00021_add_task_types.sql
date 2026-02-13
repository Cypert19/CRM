-- Migration: Add new task types for service-based businesses
-- Adds: Automations, Website Development, Custom Development, Training, Consulting
-- Note: task_type is a PostgreSQL ENUM type, so we use ALTER TYPE ... ADD VALUE

ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Automations';
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Website Development';
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Custom Development';
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Training';
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Consulting';
