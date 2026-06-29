-- patient_memory: operational memory for patients, indexed by tenant + contact.
-- Allows cross-conversation memory persistence for the V2 agent.
CREATE TABLE IF NOT EXISTS "patient_memory" (
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "contact_id" uuid NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
  "memory_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamptz DEFAULT NOW() NOT NULL,
  "updated_at" timestamptz DEFAULT NOW() NOT NULL,
  "expires_at" timestamptz,
  "last_conversation_id" uuid REFERENCES "conversations"("id") ON DELETE SET NULL,
  PRIMARY KEY ("tenant_id", "contact_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "patient_memory_tenant_contact_idx" ON "patient_memory" ("tenant_id", "contact_id");

COMMENT ON TABLE "patient_memory" IS 'Operational memory for patients. Holds funnel stage, concerns, objections, provided data flags. Not a replacement for conversation_state (which tracks flow state).';
COMMENT ON COLUMN "patient_memory"."memory_json" IS 'JSON structure matching PersistedPatientMemory interface. Key fields are extracted as indexed columns if needed later.';
COMMENT ON COLUMN "patient_memory"."version" IS 'Optimistic lock for concurrent writes. Incremented on each successful merge.';
COMMENT ON COLUMN "patient_memory"."expires_at" IS 'Optional TTL. If set, memory is considered stale after this date. NULL = no expiry.';
COMMENT ON COLUMN "patient_memory"."last_conversation_id" IS 'Most recent conversation where memory was updated. Helps trace context.';

-- RLS policy for patient_memory
ALTER TABLE "patient_memory" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient_memory_tenant_isolation" ON "patient_memory"
  FOR ALL
  USING ("tenant_id" = current_setting('app.current_tenant')::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant')::uuid);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_patient_memory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patient_memory_updated_at
  BEFORE UPDATE ON "patient_memory"
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_memory_timestamp();

-- Grant access to the bookia_app role (runtime user subject to RLS)
GRANT ALL ON "patient_memory" TO bookia_app;
