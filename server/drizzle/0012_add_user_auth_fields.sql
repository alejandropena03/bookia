-- B1: DB-backed auth — add password_hash + unique email to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;

-- Unique global email (Fase 1 decision — simplifies login lookup; revisit for multi-tenant email reuse later)
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
