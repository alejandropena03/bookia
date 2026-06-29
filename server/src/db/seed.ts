import { db, queryClient } from "./client.js";
import { tenants, channelAccounts, catalogItems, flows, users } from "./schema.js";
import { sql } from "drizzle-orm";
import { SANTA_MARIA_CATALOG } from "../flows/santa-maria/catalog.js";
import { SANTA_MARIA_CANNED, SANTA_MARIA_ESCALATION_RULES } from "../flows/santa-maria/canned-responses.js";
import { AGENDAMIENTO_FLOW, FIRST_CONTACT_FLOW } from "../flows/santa-maria/flows.js";
import { hashPassword } from "../auth/password.js";

function buildProfileData() {
  return {
    persona: "Te llamas Carlos y eres el asesor virtual de Santa María Clínica Estética. Tono cercano, amigable y natural, con muchos emojis. NO usas un menú de botones: la conversación fluye de forma humana. SIEMPRE saludas con calidez. Frases características: \"Con gusto te ayudo\", \"¿Tienes alguna duda?\", \"¿Cómo te puedo ayudar el día de hoy?\". Preguntas la ciudad del cliente al inicio para filtrar servicios y precios por país. Hablas en español. NO das diagnósticos médicos ni recomiendas qué tratamiento es \"el mejor\" para el cliente — solo informas y ofreces agendar una valoración con el doctor. NO confirmas citas sin recibir comprobante de pago. NO mencionas a la competencia. NO das precios que no estén en el catálogo.",
    rules: {
      escalation: SANTA_MARIA_ESCALATION_RULES.keywords.map((k) => ({
        keyword: k.keyword,
        reason: k.reason,
        notify: k.notify,
      })),
      no_decir: SANTA_MARIA_ESCALATION_RULES.no_decir,
      frases_caracteristicas: SANTA_MARIA_ESCALATION_RULES.frases_caracteristicas,
      escalate_to: SANTA_MARIA_ESCALATION_RULES.escalate_to,
    },
    hours: {
      lunes: { open: "09:00", close: "19:00" },
      martes: { open: "09:00", close: "19:00" },
      miércoles: { open: "09:00", close: "19:00" },
      jueves: { open: "09:00", close: "19:00" },
      viernes: { open: "09:00", close: "19:00" },
      sábado: { open: "09:00", close: "19:00" },
      domingo: { open: null, close: null },
    },
    systemPromptOverrides: null,
    cannedResponses: SANTA_MARIA_CANNED,
    offHoursMessage: null, // §9: "responde normal, sin mencionar el horario"
  };
}

async function upsertProfile(tenantId: string) {
  const pd = buildProfileData();
  const existing = await queryClient`SELECT tenant_id FROM business_profile WHERE tenant_id = ${tenantId} LIMIT 1`;
  if (existing.length > 0) {
    await queryClient`
      UPDATE business_profile SET
        persona = ${pd.persona},
        rules = ${JSON.stringify(pd.rules)}::jsonb,
        hours = ${JSON.stringify(pd.hours)}::jsonb,
        canned_responses = ${JSON.stringify(pd.cannedResponses)}::jsonb,
        off_hours_message = ${pd.offHoursMessage}
      WHERE tenant_id = ${tenantId}
    `;
    console.log(`✓ Business profile updated (${Object.keys(SANTA_MARIA_CANNED).length} canned responses)`);
  } else {
    await queryClient`
      INSERT INTO business_profile (tenant_id, persona, rules, hours, canned_responses, off_hours_message)
      VALUES (${tenantId}, ${pd.persona}, ${JSON.stringify(pd.rules)}::jsonb, ${JSON.stringify(pd.hours)}::jsonb, ${JSON.stringify(pd.cannedResponses)}::jsonb, ${pd.offHoursMessage})
    `;
    console.log(`✓ Business profile created (${Object.keys(SANTA_MARIA_CANNED).length} canned responses)`);
  }
}

async function seed() {
  console.log("🌱 Seeding Bookia database with Santa María real data...\n");

  let tenantId: string;
  let isNewTenant = false;

  const existingRows = await queryClient`SELECT id FROM tenants WHERE slug = 'santa-maria' LIMIT 1`;
  if (existingRows && existingRows.length > 0) {
    tenantId = (existingRows[0] as any).id;
    console.log(`✓ Tenant 'santa-maria' exists (${tenantId}) — upserting seed data`);
    await queryClient`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
  } else {
    const [tenant] = await db.insert(tenants).values({
      name: "Santa María Clínica Estética",
      slug: "santa-maria",
      status: "active",
    }).returning();
    tenantId = tenant.id;
    isNewTenant = true;
    console.log(`✓ Tenant created: ${tenant.name} (${tenantId})`);
    await queryClient`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
  }

  const [ca] = await queryClient`SELECT id FROM channel_accounts WHERE tenant_id = ${tenantId} AND channel = 'mock' LIMIT 1`;
  if (!ca) {
    await queryClient`
      INSERT INTO channel_accounts (tenant_id, channel, mode, external_account_id, status)
      VALUES (${tenantId}, 'mock', 'mock', 'demo-mock-001', 'connected')
    `;
    console.log('✓ Channel account created (mock)');
  } else {
    console.log('✓ Channel account already exists (mock)');
  }

  await upsertProfile(tenantId);

  await queryClient`DELETE FROM catalog_items WHERE tenant_id = ${tenantId}`;
  for (const item of SANTA_MARIA_CATALOG) {
    await queryClient`
      INSERT INTO catalog_items (tenant_id, name, description, price, currency, category, duration_minutes, cities, image_keys, promo_label, is_active)
      VALUES (
        ${tenantId}, ${item.name}, ${item.description}, ${item.price}, ${item.currency},
        ${item.category}, ${item.durationMinutes},
        ${JSON.stringify(item.cities)}::jsonb, ${JSON.stringify(item.imageKeys)}::jsonb,
        ${item.promoLabel ?? null}, 1
      )
    `;
  }
  console.log(`✓ ${SANTA_MARIA_CATALOG.length} catalog items synced (with cities + image_keys)`);

  const flowDefs = [
    { key: "agendamiento", name: "Flujo de agendamiento — Santa María", def: AGENDAMIENTO_FLOW },
    { key: "first_contact", name: "Saludo inicial natural — Santa María", def: FIRST_CONTACT_FLOW },
  ];
  for (const f of flowDefs) {
    const [ef] = await queryClient`SELECT id FROM flows WHERE tenant_id = ${tenantId} AND key = ${f.key} LIMIT 1`;
    if (ef) {
      await queryClient`UPDATE flows SET definition = ${JSON.stringify(f.def)}, version = version + 1 WHERE tenant_id = ${tenantId} AND key = ${f.key}`;
    } else {
      await queryClient`
        INSERT INTO flows (tenant_id, key, name, definition, is_active, version)
        VALUES (${tenantId}, ${f.key}, ${f.name}, ${JSON.stringify(f.def)}, 1, 2)
      `;
    }
  }
  console.log('✓ Flows synced (agendamiento + first_contact)');

  const adminHash = await hashPassword("bookia2024");
  if (isNewTenant) {
    await db.insert(users).values({
      tenantId: tenantId,
      email: "admin@santamaria.test",
      passwordHash: adminHash,
      name: "Admin Santa María",
      role: "owner",
    });
    console.log('✓ Owner user created (password: bookia2024)');
  } else {
    // Ensure existing admin has a password hash (migration 0012 added column)
    await db.execute(sql`UPDATE users SET password_hash = ${adminHash} WHERE email = 'admin@santamaria.test' AND password_hash IS NULL`);
    console.log('✓ Owner user ensured (password: bookia2024)');
  }

  const [{ count: t }] = await db.execute(sql`SELECT COUNT(*)::text AS count FROM tenants`);
  const [{ count: cc }] = await db.execute(sql`SELECT COUNT(*)::text AS count FROM channel_accounts`);
  const [{ count: bp }] = await db.execute(sql`SELECT COUNT(*)::text AS count FROM business_profile`);
  const [{ count: ci }] = await db.execute(sql`SELECT COUNT(*)::text AS count FROM catalog_items`);
  const [{ count: fc }] = await db.execute(sql`SELECT COUNT(*)::text AS count FROM flows`);
  const [{ count: u }] = await db.execute(sql`SELECT COUNT(*)::text AS count FROM users`);
  console.log(`\n📊 tenants: ${t} | channel: ${cc} | profile: ${bp} | catalog: ${ci} | flows: ${fc} | users: ${u}`);
  console.log("\n✅ Seed completed successfully!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
