-- Force RLS on patient_memory for consistency with other tenant-scoped tables.
-- 0010 only did ENABLE ROW LEVEL SECURITY; FORCE ensures even table owner is subject to RLS.
ALTER TABLE "patient_memory" FORCE ROW LEVEL SECURITY;
