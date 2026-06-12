-- RLS (Row-Level Security) for Bookia multi-tenant setup
-- This file is applied manually after the schema migration.
--
-- Usage:
--   SET app.current_tenant = '<tenant-uuid>';
--   SELECT * FROM messages; -- only sees rows for that tenant
--
-- The application should set app.current_tenant per connection/transaction.
--
-- SECURITY NOTES (revisión Claude TASK-002):
--  1. WITH CHECK además de USING: USING filtra lectura; WITH CHECK impide
--     INSERT/UPDATE con un tenant_id ajeno. Sin él, un tenant podría escribir
--     filas para otro tenant.
--  2. FORCE ROW LEVEL SECURITY: por defecto el DUEÑO de la tabla bypassa RLS.
--     FORCE lo aplica también al dueño. NOTA: SUPERUSER y roles con BYPASSRLS
--     SIEMPRE bypassan RLS, incluso con FORCE. Por eso creamos un rol app
--     limitado (bookia_app).
--  3. current_setting(..., true): el segundo arg 'true' evita que reviente si
--     el GUC no está seteado (devuelve NULL → no matchea → 0 filas, fail-safe).

-- Create a non-privileged application role for runtime (bypasses RLS if superuser)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bookia_app') THEN
    CREATE ROLE bookia_app LOGIN PASSWORD 'bookia_app_pass' NOINHERIT;
  END IF;
END
$$;

-- Grant schema and table permissions to bookia_app
GRANT USAGE ON SCHEMA public TO bookia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bookia_app;

-- Enable + FORCE RLS on all business tables (everything except `tenants`)
ALTER TABLE channel_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows FORCE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items FORCE ROW LEVEL SECURITY;
ALTER TABLE business_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profile FORCE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE conversation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_state FORCE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS tenant_isolation ON channel_accounts;
DROP POLICY IF EXISTS tenant_isolation ON contacts;
DROP POLICY IF EXISTS tenant_isolation ON conversations;
DROP POLICY IF EXISTS tenant_isolation ON messages;
DROP POLICY IF EXISTS tenant_isolation ON flows;
DROP POLICY IF EXISTS tenant_isolation ON catalog_items;
DROP POLICY IF EXISTS tenant_isolation ON business_profile;
DROP POLICY IF EXISTS tenant_isolation ON users;
DROP POLICY IF EXISTS tenant_isolation ON conversation_state;

-- Create tenant isolation policies (USING filtra lectura, WITH CHECK impide escritura cross-tenant)
CREATE POLICY tenant_isolation ON channel_accounts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation ON contacts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation ON conversations
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation ON messages
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation ON flows
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation ON catalog_items
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation ON business_profile
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation ON users
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation ON conversation_state
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);
