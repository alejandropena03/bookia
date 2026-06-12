-- Handoff summary field for conversations
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "handoff_summary" text;
