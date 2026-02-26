-- Migration: Add Prospect model and ADMIN role
-- Run this in your production database

-- Add ADMIN to UserRole enum (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'UserRole' AND e.enumlabel = 'ADMIN') THEN
    ALTER TYPE "UserRole" ADD VALUE 'ADMIN';
  END IF;
END $$;

-- Create prospects table
CREATE TABLE IF NOT EXISTS "prospects" (
  "id"                   TEXT NOT NULL,
  "email"                TEXT NOT NULL,
  "name"                 TEXT NOT NULL,
  "plan"                 TEXT NOT NULL DEFAULT 'biannual',
  "notes"                TEXT,
  "status"               TEXT NOT NULL DEFAULT 'pending',
  "paymentLinkSentAt"    TIMESTAMP(3),
  "paymentLinkSentBy"    TEXT,
  "paidAt"               TIMESTAMP(3),
  "stripeSessionId"      TEXT,
  "onboardingLinkSentAt" TIMESTAMP(3),
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "prospects_email_key" ON "prospects"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "prospects_stripeSessionId_key" ON "prospects"("stripeSessionId");
