/**
 * seed-demo.ts — Puebla datos de muestra realistas para Santa María.
 * Idempotente: limpia datos demo antes de re-insertar (conversaciones,
 * mensajes, bookings, conversation_state, contacts de prueba).
 * No toca: tenants, catalog_items, flows, business_profile, users.
 *
 * Uso: npx tsx src/db/seed-demo.ts
 * (debe correrse DESPUÉS del seed base: npx tsx src/db/seed.ts)
 */

import postgres from "postgres";
import { randomUUID } from "crypto";

const DB_URL = process.env.DATABASE_URL ?? "postgres://bookia:bookia_pass@localhost:5432/bookia";
const sql = postgres(DB_URL, {
  max: 1, idle_timeout: 10, connect_timeout: 10,
});

// ─── Config ───

const CHANNELS = ["whatsapp", "instagram", "messenger"] as const;
const CONTACT_NAMES = [
  "María López", "Carolina Rojas", "Andrea Gómez", "Daniela Pérez",
  "Valentina Suárez", "Fernanda Díaz", "Gabriela Torres", "Sofía Ramírez",
  "Isabella Castro", "Camila Mendoza", "Laura Jiménez", "Ximena Ruiz",
  "Paola Herrera", "Natalia Vargas", "Alejandra Mora",
];
const MESSAGES_INBOUND = [
  "Hola, buenos días",
  "Buenas tardes, quisiera información",
  "Hola, ¿cómo están?",
  "Quisiera saber sobre los servicios que ofrecen",
  "Hola, me interesa agendar una cita",
  "Buenos días, ¿tienen disponibles?",
  "Hola, ¿cuánto cuesta la depilación láser?",
  "Quiero información sobre precios",
  "Buenas, ¿qué tratamientos faciales tienen?",
  "Hola, ¿me pueden dar más información del masaje relajante?",
  "¿Cuánto vale la consulta dermatológica?",
  "Buenas tardes, quisiera agendar",
  "Hola, ¿tienen promociones?",
  "¿El paquete premium incluye cuántas sesiones?",
  "Hola, ¿atienden los sábados?",
  "Me interesa el tratamiento facial",
  "¿Cuánto cuesta la depilación láser en axilas?",
  "Quiero saber el precio del paquete de bienestar",
  "Buenos días, ¿puedo agendar para esta semana?",
  "Hola, ¿me ayudan con una consulta?",
  "¿Tienen disponibles para masaje hoy?",
  "Hola, quiero hacer una reserva",
  "¿Cuánto tiempo dura cada sesión?",
  "Buenas, ¿qué métodos de pago aceptan?",
];
const MESSAGES_OUTBOUND = [
  "¡Hola! Bienvenido a Santa María Clínica Estética. ¿En qué puedo ayudarte hoy?",
  "Claro, con gusto te informamos. Tenemos varios servicios disponibles.",
  "Con mucho gusto. Déjame consultarte...",
  "¡Gracias por tu interés! Te cuento sobre nuestros servicios.",
  "Perfecto, podemos agendar tu cita. ¿Qué día te gustaría?",
  "Sí, tenemos disponibilidad. ¿Qué servicio te interesa?",
  "La depilación láser tiene un costo de $350.000 por sesión. ¿Te gustaría agendar?",
  "Nuestros precios varían según el servicio. ¿Cuál te interesa en particular?",
  "Tenemos tratamientos faciales desde $280.000. ¿Te gustaría conocer más?",
  "El masaje relajante cuesta $200.000 por sesión de 60 minutos.",
  "La consulta dermatológica tiene un valor de $150.000.",
  "¡Claro! ¿Qué día y hora prefieres?",
  "Sí, tenemos promociones especiales. Te cuento...",
  "El paquete premium incluye 4 sesiones por $650.000.",
  "Sí, atendemos los sábados de 9:00 a 22:30.",
  "El tratamiento facial profundo es excelente para revitalizar la piel.",
  "Te cuento: depilación láser en axilas $200.000 por sesión.",
  "El paquete de bienestar incluye 5 faciales + 2 masajes por $1.200.000.",
  "Déjame revisar disponibilidad y te confirmo.",
  "¡Por supuesto! Te atenderemos con gusto.",
  "Sí, tenemos espacio para masaje hoy. ¿A qué hora?",
  "Genial, voy a agendar tu cita. ¿Me confirmas tus datos?",
  "Cada sesión dura aproximadamente 45-60 minutos.",
  "Aceptamos transferencia bancaria, Nequi, y tarjeta de crédito/débito.",
];
const PRICE_KEYWORDS = ["precio", "cuánto", "cuesta", "costo", "tarifa", "valor"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateWeighted(daysAgo: number): Date {
  const now = Date.now();
  const start = now - daysAgo * 24 * 60 * 60 * 1000;
  const offset = Math.random() * (now - start);
  const d = new Date(start + offset);
  // Bias toward evening hours for natural heatmap shape:
  // 60% tarde-noche (15-21), 30% mañana (9-14), 10% otro (6-8 o 22)
  const r = Math.random();
  let hour: number;
  if (r < 0.6) hour = randomInt(15, 21);
  else if (r < 0.9) hour = randomInt(9, 14);
  else hour = randomInt(Math.random() < 0.5 ? 6 : 22, Math.random() < 0.5 ? 8 : 23);
  d.setHours(hour, randomInt(0, 59), randomInt(0, 59), 0);
  return d;
}

async function seedDemo() {
  console.log("🎭 Seeding demo data for Santa María...\n");

  // ── Get Santa María tenant ──
  const [tenant] = await sql`SELECT id, slug FROM tenants WHERE slug = 'santa-maria' LIMIT 1`;
  if (!tenant) {
    console.error("❌ Tenant 'santa-maria' not found. Run seed.ts first.");
    process.exit(1);
  }
  const tenantId = tenant.id;
  await sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
  console.log(`✓ Tenant: ${tenant.slug} (${tenantId})`);

  // ── Get channel_accounts (create missing ones) ──
  const channelIds: Record<string, string> = {};
  for (const ch of CHANNELS) {
    let [ca] = await sql`SELECT id FROM channel_accounts WHERE tenant_id = ${tenantId} AND channel = ${ch} LIMIT 1`;
    if (!ca) {
      [ca] = await sql`
        INSERT INTO channel_accounts (tenant_id, channel, mode, status, external_account_id)
        VALUES (${tenantId}, ${ch}, 'mock', 'connected', ${`demo-${ch}-001`})
        RETURNING id
      `;
    }
    channelIds[ch] = ca.id;
  }
  // Ensure mock channel exists (from seed)
  let [mockCa] = await sql`SELECT id FROM channel_accounts WHERE tenant_id = ${tenantId} AND channel = 'mock' LIMIT 1`;
  if (!mockCa) {
    [mockCa] = await sql`
      INSERT INTO channel_accounts (tenant_id, channel, mode, status, external_account_id)
      VALUES (${tenantId}, 'mock', 'mock', 'connected', 'demo-mock-001')
      RETURNING id
    `;
  }
  channelIds.mock = mockCa.id;
  console.log(`✓ Channel accounts: ${Object.keys(channelIds).join(", ")}`);

  // ── Get catalog items for service mapping ──
  const catalogItems = await sql`
    SELECT id, name, price::numeric FROM catalog_items
    WHERE tenant_id = ${tenantId} AND is_active = 1
  `;
  console.log(`✓ Catalog items: ${catalogItems.length}`);

  // ── Clean existing demo data (conversations, messages, etc.) ──
  await sql`DELETE FROM bookings WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM conversation_state WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM messages WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM conversations WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM contacts WHERE tenant_id = ${tenantId}`;
  console.log("✓ Cleaned existing demo data\n");

  // ── Create contacts + conversations + messages ──
  const contactIds: string[] = [];
  const convIds: string[] = [];
  const bookingConvs: string[] = [];
  const priceConvs: string[] = []; // conversations that asked price without booking
  const allMessageTexts: { convId: string; direction: string; sender: string; text: string; createdAt: Date }[] = [];

  for (let i = 0; i < CONTACT_NAMES.length; i++) {
    const name = CONTACT_NAMES[i];
    const channel = randomPick(CHANNELS);
    const externalId = `demo-${channel}-${i + 1}`;
    const phone = `300${String(randomInt(1000000, 9999999))}`;

    // Insert contact
    const [contact] = await sql`
      INSERT INTO contacts (tenant_id, channel, external_id, name, phone)
      VALUES (${tenantId}, ${channel}, ${externalId}, ${name}, ${phone})
      RETURNING id
    `;
    contactIds.push(contact.id);

    // Conversation status distribution: ~40% bot_active, ~20% human_active, ~15% escalated, ~25% closed
    let status: string;
    const r = Math.random();
    if (r < 0.4) status = "bot_active";
    else if (r < 0.6) status = "human_active";
    else if (r < 0.75) status = "escalated";
    else status = "closed";

    // Determine if this conversation has a booking (~35% of conversations)
    const hasBooking = Math.random() < 0.35;
    // Determine if this conversation asked price without booking (~20% of conversations)
    const hasPriceNoBooking = !hasBooking && Math.random() < 0.3;

    // Conversation start date (spread over last 30 days)
    const convStart = randomDateWeighted(29);
    const msgCount = randomInt(5, 25);

    // Create conversation
    const [conv] = await sql`
      INSERT INTO conversations (tenant_id, contact_id, channel_account_id, status, created_at, last_message_at)
      VALUES (${tenantId}, ${contact.id}, ${channelIds[channel]}, ${status}, ${convStart.toISOString()}, ${convStart.toISOString()})
      RETURNING id
    `;
    convIds.push(conv.id);

    // Generate messages
    for (let m = 0; m < msgCount; m++) {
      const isInbound = m % 2 === 0;
      const msgTime = new Date(convStart.getTime() + m * randomInt(1, 60) * 60 * 1000);

      let text: string;
      if (isInbound) {
        if (hasPriceNoBooking) {
          // Some messages should have price keywords
          if (m === 1 || (m < msgCount && Math.random() < 0.2)) {
            text = randomPick(PRICE_KEYWORDS) === "precio"
              ? `¿Cuál es el precio de ${randomPick(catalogItems).name}?`
              : `¿Cuánto cuesta ${randomPick(catalogItems).name}?`;
          } else {
            text = randomPick(MESSAGES_INBOUND);
          }
        } else {
          text = randomPick(MESSAGES_INBOUND);
        }
      } else {
        if (hasBooking && m === msgCount - 2) {
          text = "¡Gracias! Quedo atenta a la confirmación.";
        } else if (hasBooking && m === msgCount - 1) {
          text = "✅ Cita confirmada. Te esperamos.";
        } else {
          text = randomPick(MESSAGES_OUTBOUND);
        }
      }

      const sender = isInbound ? "contact" : "bot";
      allMessageTexts.push({
        convId: conv.id,
        direction: isInbound ? "inbound" : "outbound",
        sender,
        text,
        createdAt: msgTime,
      });

      if (isInbound && hasPriceNoBooking && (text.includes("precio") || text.includes("cuánto") || text.includes("cuesta"))) {
        if (!priceConvs.includes(conv.id)) priceConvs.push(conv.id);
      }
    }

    // Update last_message_at
    if (allMessageTexts.length > 0) {
      const lastMsg = allMessageTexts[allMessageTexts.length - 1];
      await sql`
        UPDATE conversations SET last_message_at = ${lastMsg.createdAt.toISOString()}
        WHERE id = ${conv.id}
      `;
    }

    // Create booking for ~35% of conversations
    if (hasBooking) {
      const svc = randomPick(catalogItems);
      const bookingDate = new Date(convStart.getTime() + 2 * 24 * 60 * 60 * 1000);
      const bookingStatus = Math.random() < 0.7 ? "confirmed" : (Math.random() < 0.5 ? "scheduled" : "pending");

      await sql`
        INSERT INTO bookings (tenant_id, conversation_id, contact_id, service_name, service_price, datetime, status)
        VALUES (${tenantId}, ${conv.id}, ${contact.id}, ${svc.name}, ${String(svc.price)}, ${bookingDate.toISOString()}, ${bookingStatus})
      `;
      bookingConvs.push(conv.id);

      // Add conversation_state for booking flow
      await sql`
        INSERT INTO conversation_state (tenant_id, conversation_id, flow_key, current_state, slots, created_at, updated_at)
        VALUES (
          ${tenantId}, ${conv.id}, 'agendamiento', 'confirm_booking',
          ${sql.json({ servicio: svc.name, city: "Bogotá", datetime: bookingDate.toISOString() })},
          ${convStart.toISOString()}, ${bookingDate.toISOString()}
        )
      `;
    }

    // Add conversation_state for price conversations without booking
    if (hasPriceNoBooking) {
      const svc = randomPick(catalogItems);
      await sql`
        INSERT INTO conversation_state (tenant_id, conversation_id, flow_key, current_state, slots, created_at, updated_at)
        VALUES (
          ${tenantId}, ${conv.id}, 'agendamiento', 'precio',
          ${sql.json({ servicio: svc.name })},
          ${convStart.toISOString()}, ${convStart.toISOString()}
        )
      `;
    }
  }

  // ── Bulk insert messages ──
  console.log(`  Inserting ${allMessageTexts.length} messages...`);
  for (const msg of allMessageTexts) {
    await sql`
      INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, content_type, text, created_at)
      VALUES (${tenantId}, ${msg.convId}, ${msg.direction}, ${msg.sender}, 'text', ${msg.text}, ${msg.createdAt.toISOString()})
    `;
  }

  // ── Summary ──
  const [{ count: contacts }] = await sql`SELECT COUNT(*)::int AS count FROM contacts WHERE tenant_id = ${tenantId}`;
  const [{ count: conversations }] = await sql`SELECT COUNT(*)::int AS count FROM conversations WHERE tenant_id = ${tenantId}`;
  const [{ count: messages }] = await sql`SELECT COUNT(*)::int AS count FROM messages WHERE tenant_id = ${tenantId}`;
  const [{ count: bookings }] = await sql`SELECT COUNT(*)::int AS count FROM bookings WHERE tenant_id = ${tenantId}`;
  const [{ count: states }] = await sql`SELECT COUNT(*)::int AS count FROM conversation_state WHERE tenant_id = ${tenantId}`;

  console.log(`\n📊 Demo seed summary:`);
  console.log(`  contacts:              ${contacts}`);
  console.log(`  conversations:         ${conversations}`);
  console.log(`  messages:              ${messages}`);
  console.log(`  bookings:              ${bookings}`);
  console.log(`  conversation_state:     ${states}`);
  console.log(`  price with no booking:  ${priceConvs.length}`);
  console.log(`\n✅ Demo seed completed successfully!`);
}

seedDemo().catch((err) => {
  console.error("❌ Demo seed failed:", err);
  process.exit(1);
});
