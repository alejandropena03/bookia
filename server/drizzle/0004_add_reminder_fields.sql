-- Add reminder tracking fields to bookings
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "reminder_sent_at" timestamp with time zone;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "reminder_status" text DEFAULT 'none';

-- Worker execution log
CREATE TABLE IF NOT EXISTS "worker_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "worker" text NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "finished_at" timestamp with time zone,
  "status" text NOT NULL DEFAULT 'running',
  "summary" jsonb DEFAULT '{}'::jsonb NOT NULL
);
