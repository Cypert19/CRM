-- Migration: Add missing deal detail columns
-- These columns are referenced in types/database.ts and the deal form UI
-- but were never added to the actual database schema.

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS deal_industry text DEFAULT NULL
    CHECK (deal_industry IN ('technology', 'healthcare', 'finance', 'manufacturing', 'retail', 'education', 'consulting', 'real_estate', 'other')),
  ADD COLUMN IF NOT EXISTS company_size text DEFAULT NULL
    CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  ADD COLUMN IF NOT EXISTS scope text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS services_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS adoption_capacity text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS next_step text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS competitor text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_type text DEFAULT NULL
    CHECK (payment_type IN ('one_time', 'retainer')),
  ADD COLUMN IF NOT EXISTS payment_frequency text DEFAULT NULL
    CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually'));

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
