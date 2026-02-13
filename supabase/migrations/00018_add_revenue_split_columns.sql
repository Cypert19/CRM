-- Migration: Add separate revenue tracking columns to deals
-- Splits the single "value" field into three distinct revenue categories:
--   1. audit_fee: upfront discovery/audit cost
--   2. retainer_monthly: recurring monthly retainer amount
--   3. custom_dev_fee: one-time custom development fee
-- The existing "value" column is kept as a computed total for backwards compatibility.

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS audit_fee numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS retainer_monthly numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS custom_dev_fee numeric DEFAULT 0 NOT NULL;

-- Create a trigger that auto-computes "value" as the sum of the three revenue fields
-- so existing reports/aggregations that use "value" continue working.
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

-- Backfill existing deals: put the current value into custom_dev_fee as a default
-- (users can manually reassign later)
UPDATE deals
SET custom_dev_fee = value
WHERE value > 0
  AND audit_fee = 0
  AND retainer_monthly = 0
  AND custom_dev_fee = 0;
