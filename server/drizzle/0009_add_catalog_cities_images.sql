-- Multi-city + image mapping for catalog_items (Santa María hyper-personalization)
-- Each service can now declare which cities offer it and which image cards to attach.
ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "cities" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "image_keys" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "promo_label" text;

COMMENT ON COLUMN "catalog_items"."cities" IS 'Array of city names where this service is available (e.g. ["Medellín","Bogotá"]). Empty array = all tenant cities.';
COMMENT ON COLUMN "catalog_items"."image_keys" IS 'Array of image manifest keys (e.g. ["image6.jpeg"]) to attach as service cards.';
COMMENT ON COLUMN "catalog_items"."promo_label" IS 'Optional promo tag (e.g. "Mes del Padre").';