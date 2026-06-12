-- Add canned_responses and off_hours_message columns to business_profile
ALTER TABLE "business_profile" ADD COLUMN IF NOT EXISTS "canned_responses" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "business_profile" ADD COLUMN IF NOT EXISTS "off_hours_message" text;
