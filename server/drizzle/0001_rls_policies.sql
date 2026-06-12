-- RLS (Row-Level Security) for Bookia multi-tenant setup
-- This file is applied manually after the schema migration.
--
-- Usage:
--   SET app.current_tenant = '<tenant-uuid>';
--   SELECT * FROM messages; -- only sees rows for that tenant
--
-- The application should set app.current_tenant per connection/transaction.

-- Enable RLS on all business tables (everything except `tenants`)
ALTER TABLE channel_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS tenant_isolation ON channel_accounts;
DROP POLICY IF EXISTS tenant_isolation ON contacts;
DROP POLICY IF EXISTS tenant_isolation ON conversations;
DROP POLICY IF EXISTS tenant_isolation ON messages;
DROP POLICY IF EXISTS tenant_isolation ON flows;
DROP POLICY IF EXISTS tenant_isolation ON catalog_items;
DROP POLICY IF EXISTS tenant_isolation ON business_profile;
DROP POLICY IF EXISTS tenant_isolation ON users;

-- Create tenant isolation policies
CREATE POLICY tenant_isolation ON channel_accounts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation ON contacts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation ON conversations
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation ON messages
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation ON flows
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation ON catalog_items
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation ON business_profile
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation ON users
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
