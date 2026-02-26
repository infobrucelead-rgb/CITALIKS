-- Migration: add_sms_fields_to_appointments
-- Run this SQL in your production database to add SMS tracking fields

ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "smsConfirmationSent"   BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "smsConfirmationSentAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "smsReminderSent"        BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "smsReminderSentAt"      TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "smsCancellationSent"    BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "smsCancellationSentAt"  TIMESTAMP;
