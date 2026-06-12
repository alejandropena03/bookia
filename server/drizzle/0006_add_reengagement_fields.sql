-- Re-engagement tracking fields for conversation_state
ALTER TABLE "conversation_state" ADD COLUMN IF NOT EXISTS "reengagement_step" integer DEFAULT 0 NOT NULL;
ALTER TABLE "conversation_state" ADD COLUMN IF NOT EXISTS "last_reengagement_at" timestamp with time zone;
