-- CRM post-servicio fields
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "post_service_sent_at" timestamp with time zone;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "repurchase_sent_at" timestamp with time zone;
ALTER TABLE "business_profile" ADD COLUMN IF NOT EXISTS "google_maps_url" text;
