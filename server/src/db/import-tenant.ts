/**
 * import-tenant.ts — Importa/actualiza un tenant desde un archivo JSON.
 * Idempotente: upserts business_profile, catalog_items, flows.
 * No borra datos existentes de conversaciones/mensajes/contacts.
 *
 * Uso: npx tsx src/db/import-tenant.ts --slug=santa-maria
 *
 * Formato JSON: ver tenant-config/santa-maria.json
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db, queryClient } from "./client.js";
import { tenants, businessProfile, catalogItems, flows } from "./schema.js";
import { sql, eq, and } from "drizzle-orm";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface TenantConfig {
  slug: string;
  business_name: string;
  agent_name: string;
  persona: string;
  tone: string;
  hours: Record<string, { open: string | null; close: string | null }>;
  off_hours_message: string | null;
  system_prompt_overrides: string | null;
  booking_mode: "mock" | "handoff";
  catalog: Array<{
    name: string;
    description: string | null;
    price: string;
    currency: string;
    category: string | null;
    duration_minutes: number | null;
    cities?: string[];
    image_keys?: string[];
    promo_label?: string | null;
  }>;
  canned_responses: Record<string, string>;
  escalation_rules: Array<{ keyword: string; reason: string; notify: boolean }>;
  flows: Record<string, {
    initial: string;
    states: Record<string, unknown>;
  }>;
}

async function importTenant(configPath: string) {
  if (!existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
  }

  const raw = readFileSync(configPath, "utf-8");
  const config: TenantConfig = JSON.parse(raw);

  console.log(`📦 Importing tenant: ${config.slug} (${config.business_name})\n`);

  // ── Resolve tenant ──
  let [tenant] = await db.select().from(tenants).where(eq(tenants.slug, config.slug)).limit(1);
  if (!tenant) {
    [tenant] = await db.insert(tenants).values({
      name: config.business_name,
      slug: config.slug,
      status: "active",
    }).returning();
    console.log(`✓ Tenant created: ${tenant.name} (${tenant.id})`);
  } else {
    console.log(`✓ Tenant exists: ${tenant.name} (${tenant.id})`);
  }

  await queryClient`SELECT set_config('app.current_tenant', ${tenant.id}, true)`;

  // ── Business profile ──
  const [existingProfile] = await db.select().from(businessProfile).where(eq(businessProfile.tenantId, tenant.id)).limit(1);
  const profileData = {
    persona: config.persona,
    rules: {
      escalation: config.escalation_rules,
      no_decir: [
        "diagnósticos médicos",
        "recomendaciones médicas personalizadas",
        "precios que no estén en el catálogo",
        "promesas de resultados",
      ],
    },
    hours: config.hours,
    bookingMode: config.booking_mode,
    systemPromptOverrides: config.system_prompt_overrides,
    cannedResponses: config.canned_responses,
    offHoursMessage: config.off_hours_message,
  } as const;

  if (existingProfile) {
    await db.update(businessProfile)
      .set({ ...profileData, updatedAt: sql`NOW()` })
      .where(eq(businessProfile.tenantId, tenant.id));
    console.log("✓ Business profile updated");
  } else {
    await db.insert(businessProfile).values({ tenantId: tenant.id, ...profileData });
    console.log("✓ Business profile created");
  }

  // ── Catalog items (upsert by name) ──
  for (const item of config.catalog) {
    const [existing] = await db.select()
      .from(catalogItems)
      .where(and(eq(catalogItems.tenantId, tenant.id), eq(catalogItems.name, item.name)))
      .limit(1);

    const values = {
      tenantId: tenant.id,
      name: item.name,
      description: item.description,
      price: item.price,
      currency: item.currency,
      category: item.category,
      durationMinutes: item.duration_minutes,
      cities: item.cities ?? [],
      imageKeys: item.image_keys ?? [],
      promoLabel: item.promo_label ?? null,
      isActive: 1,
    };

    if (existing) {
      await db.update(catalogItems).set(values).where(eq(catalogItems.id, existing.id));
    } else {
      await db.insert(catalogItems).values(values);
    }
  }
  console.log(`✓ ${config.catalog.length} catalog items synced`);

  // ── Flows (upsert by key) ──
  for (const [key, definition] of Object.entries(config.flows)) {
    const [existingFlow] = await db.select()
      .from(flows)
      .where(and(eq(flows.tenantId, tenant.id), eq(flows.key, key)))
      .limit(1);

    const flowValues = {
      tenantId: tenant.id,
      key,
      name: key === "agendamiento" ? "Flujo de agendamiento de citas" : `Flujo: ${key}`,
      definition: definition as unknown as Record<string, unknown>,
      isActive: 1,
      version: existingFlow ? existingFlow.version + 1 : 1,
    };

    if (existingFlow) {
      await db.update(flows).set(flowValues).where(eq(flows.id, existingFlow.id));
    } else {
      await db.insert(flows).values(flowValues);
    }
  }
  console.log(`✓ ${Object.keys(config.flows).length} flows synced`);

  console.log(`\n✅ Tenant "${config.slug}" imported successfully!`);
}

// ── CLI ──
const slugArg = process.argv.find((a) => a.startsWith("--slug="));
const slug = slugArg?.split("=")[1] ?? "santa-maria";
const configPath = join(__dirname, "tenant-config", `${slug}.json`);

importTenant(configPath).catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
