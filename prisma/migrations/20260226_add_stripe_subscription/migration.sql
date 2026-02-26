-- Migration: Add Stripe subscription fields to clients table
-- Run this in your production PostgreSQL database

ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId"      TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId"  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "stripePriceId"         TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionPlan"      TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionStatus"    TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS "subscriptionStart"     TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "subscriptionEnd"       TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "trialEnd"              TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "lastPaymentAt"         TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "renewalReminderSent"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "renewalReminderSentAt" TIMESTAMP;

-- Index for subscription status queries (used by cron)
CREATE INDEX IF NOT EXISTS "clients_subscriptionStatus_idx" ON "clients"("subscriptionStatus");
CREATE INDEX IF NOT EXISTS "clients_subscriptionEnd_idx" ON "clients"("subscriptionEnd");
