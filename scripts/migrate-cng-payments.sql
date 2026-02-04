-- Migration: Replace Stripe columns with CNG payment columns
-- Run this ONLY if you have existing data and have not yet run db:push with the new schema.
-- If starting fresh, just run: npm run db:push

-- Payments: rename stripe_payment_intent_id to external_payment_id (skip if already renamed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE payments RENAME COLUMN stripe_payment_intent_id TO external_payment_id;
  END IF;
END $$;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_platform VARCHAR;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_number VARCHAR;

-- Event registrations: rename stripe_payment_intent_id to external_payment_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_registrations' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE event_registrations RENAME COLUMN stripe_payment_intent_id TO external_payment_id;
  END IF;
END $$;
