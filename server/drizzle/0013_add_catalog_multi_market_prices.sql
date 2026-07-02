-- Precios multi-mercado para catalog_items (Santa María — COP/MXN/USD/EUR).
-- El archivo estático SANTA_MARIA_CATALOG siempre tuvo esta data (usada para el
-- contexto del LLM y para elegir imágenes por mercado), pero la tabla real de
-- catalog_items NUNCA tuvo estas columnas — por eso los flujos de agendamiento y
-- precio siempre mostraban el precio en COP sin importar la ciudad del cliente.
ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "prices" jsonb;
ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "requires_human_confirmation" jsonb;

COMMENT ON COLUMN "catalog_items"."prices" IS 'Precio por mercado: {"COP":{"price":"630000"},"MXN":{"price":"5000"},...}. Si es null, se usa price/currency como único valor.';
COMMENT ON COLUMN "catalog_items"."requires_human_confirmation" IS 'Array de mercados sin precio confirmado (ej. ["MXN","USD"]) — el agente no inventa el precio, remite a Elkin.';
