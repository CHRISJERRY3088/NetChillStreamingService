-- Add recurring_billing_enabled to users (idempotent)
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS recurring_billing_enabled boolean DEFAULT false;
