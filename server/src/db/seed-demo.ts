/**
 * seed-demo.ts — Genera conversaciones de demo REALES para Santa María.
 * A diferencia de la versión anterior (mensajes hardcodeados al azar), este
 * script hace correr guiones de usuario a través del agente V2 real
 * (ingestInbound + processMessage, el mismo pipeline que /api/sim/message),
 * así que las respuestas de Carlos son las que el agente produce de verdad
 * (LLM + flows reales, no texto de relleno).
 *
 * Idempotente: limpia datos demo antes de re-insertar (conversaciones,
 * mensajes, bookings, conversation_state, contacts de prueba).
 * No toca: tenants, catalog_items, flows, business_profile, users.
 *
 * Uso: npx tsx src/db/seed-demo.ts
 * (debe correrse DESPUÉS del seed base: npx tsx src/db/seed.ts, y con el
 * backend NO necesariamente corriendo — este script llama al agente in-process)
 */

import "dotenv/config";
import postgres from "postgres";
import { randomUUID } from "crypto";
import { ingestInbound } from "../conversations/service.js";
import { processMessage } from "../agent/orchestrator.js";
import type { NormalizedInboundMessage } from "../channels/types.js";

const DB_URL = process.env.DATABASE_URL ?? "postgres://bookia:bookia_pass@localhost:5432/bookia";
const sql = postgres(DB_URL, {
  max: 1, idle_timeout: 10, connect_timeout: 10,
});

const TENANT_SLUG = "santa-maria";

// ─── Personas / guiones ───
// Cada guión es una secuencia de mensajes de un usuario simulado. Las
// respuestas del bot NO están escritas aquí: las genera el agente real.

type PersonaType = "booking" | "price_dropoff" | "faq" | "escalation";

interface Persona {
  name: string;
  channel: "whatsapp" | "instagram" | "messenger";
  type: PersonaType;
  phone: string;
  service?: string; // nombre exacto del catalog_items usado en el guión
  messages: string[];
}

const PERSONAS: Persona[] = [
  // ── Booking completo (5) ──
  {
    name: "María López", channel: "whatsapp", type: "booking", phone: "3001234501",
    service: "Botox por zona",
    messages: [
      "Hola, buenas tardes",
      "Me gustaría agendar una cita",
      "Bogotá",
      "Botox por zona",
      "Sí, me gustaría agendar",
      "Perfecto, el próximo sábado a las 3:00 pm si tienen disponibilidad",
      "María López, cédula 1020304050, nací el 15 de marzo de 1990, mi celular es 3001234501, mi correo es maria.lopez.demo@gmail.com",
      "Transferencia bancaria",
      "Listo, aquí está el comprobante de pago",
    ],
  },
  {
    name: "Carolina Rojas", channel: "instagram", type: "booking", phone: "3001234502",
    service: "Doll Lips",
    messages: [
      "Hola, buenas",
      "Quisiera agendar una cita",
      "Bogotá",
      "Doll Lips",
      "Claro, quiero agendar",
      "El jueves en la tarde, la hora que tengan libre",
      "Carolina Rojas, cédula 1020304051, nací el 22 de junio de 1988, mi celular es 3001234502, mi correo es carolina.rojas.demo@gmail.com",
      "Transferencia bancaria",
      "Aquí está el comprobante de pago",
    ],
  },
  {
    name: "Andrea Gómez", channel: "messenger", type: "booking", phone: "3001234503",
    service: "Rinomodelación",
    messages: [
      "Hola, buenas tardes",
      "Me interesa agendar una valoración",
      "Bogotá",
      "Rinomodelación",
      "Sí, quiero agendar",
      "El viernes a primera hora si se puede",
      "Andrea Gómez, cédula 1020304052, nací el 3 de septiembre de 1995, mi celular es 3001234503, mi correo es andrea.gomez.demo@gmail.com",
      "Transferencia bancaria",
      "Ya hice el pago, les envío el comprobante",
    ],
  },
  {
    name: "Daniela Pérez", channel: "whatsapp", type: "booking", phone: "3001234504",
    service: "Full Face Botox",
    messages: [
      "Hola, buenos días",
      "Quiero agendar una cita para Full Face Botox",
      "Bogotá",
      "Full Face Botox",
      "Sí, me gustaría agendar",
      "El sábado en la mañana",
      "Daniela Pérez, cédula 1020304053, nací el 11 de enero de 1992, mi celular es 3001234504, mi correo es daniela.perez.demo@gmail.com",
      "Transferencia bancaria",
      "Aquí está el comprobante de pago",
    ],
  },
  {
    name: "Valentina Suárez", channel: "instagram", type: "booking", phone: "3001234505",
    service: "Russian Lips",
    messages: [
      "Hola, ¿cómo están?",
      "Me gustaría agendar una cita",
      "Bogotá",
      "Russian Lips",
      "Sí, quiero agendar",
      "El próximo miércoles en la tarde",
      "Valentina Suárez, cédula 1020304054, nací el 27 de noviembre de 1993, mi celular es 3001234505, mi correo es valentina.suarez.demo@gmail.com",
      "Transferencia bancaria",
      "Listo, aquí está el comprobante",
    ],
  },
  // ── Pregunta precio sin agendar (3) ──
  {
    name: "Fernanda Díaz", channel: "messenger", type: "price_dropoff", phone: "3001234506",
    service: "Barbie Botox",
    messages: [
      "Hola, buenas",
      "¿Cuánto cuesta el Barbie Botox?",
      "Bogotá",
      "Barbie Botox",
      "Ah ok, gracias, lo voy a pensar",
    ],
  },
  {
    name: "Gabriela Torres", channel: "whatsapp", type: "price_dropoff", phone: "3001234507",
    service: "Bichectomía enzimática",
    messages: [
      "Hola, buenas tardes",
      "¿Cuál es el precio de la bichectomía enzimática?",
      "Bogotá",
      "Bichectomía enzimática",
      "Gracias, lo pienso y les escribo",
    ],
  },
  {
    name: "Sofía Ramírez", channel: "instagram", type: "price_dropoff", phone: "3001234508",
    service: "Red Lips",
    messages: [
      "Hola",
      "¿Cuánto vale el Red Lips?",
      "Bogotá",
      "Red Lips",
      "Ok, gracias, cualquier cosa les escribo",
    ],
  },
  // ── FAQ / interés general, sin agendar (2) ──
  {
    name: "Isabella Castro", channel: "messenger", type: "faq", phone: "3001234509",
    messages: [
      "Hola, buenas",
      "¿Qué tratamientos faciales tienen disponibles?",
      "¿Cuál me recomiendan para líneas de expresión?",
    ],
  },
  {
    name: "Camila Mendoza", channel: "whatsapp", type: "faq", phone: "3001234510",
    messages: [
      "Hola, ¿cómo están?",
      "¿Cuánto dura una sesión de botox?",
      "¿Y cada cuánto hay que repetirla?",
    ],
  },
  // ── Escalamiento real (2) ──
  {
    name: "Laura Jiménez", channel: "instagram", type: "escalation", phone: "3001234511",
    messages: [
      "Hola, buenas",
      "Hola, me salió una hinchazón muy fuerte después de mi tratamiento de botox, me preocupa",
    ],
  },
  {
    name: "Ximena Ruiz", channel: "messenger", type: "escalation", phone: "3001234512",
    messages: [
      "Hola",
      "Quiero poner una queja, el servicio fue pésimo y nadie me atendió bien",
    ],
  },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateWeighted(daysAgo: number): Date {
  const now = Date.now();
  const start = now - daysAgo * 24 * 60 * 60 * 1000;
  const offset = Math.random() * (now - start);
  const d = new Date(start + offset);
  // Sesgo hacia horas tarde-noche para forma natural del heatmap:
  // 60% tarde-noche (15-21), 30% mañana (9-14), 10% otro (6-8 o 22)
  const r = Math.random();
  let hour: number;
  if (r < 0.6) hour = randomInt(15, 21);
  else if (r < 0.9) hour = randomInt(9, 14);
  else hour = randomInt(Math.random() < 0.5 ? 6 : 22, Math.random() < 0.5 ? 8 : 23);
  d.setHours(hour, randomInt(0, 59), randomInt(0, 59), 0);
  return d;
}

async function sendTurn(
  tenantId: string,
  channel: Persona["channel"],
  externalId: string,
  name: string,
  phone: string,
  text: string,
): Promise<{ conversationId: string; contactId: string; escalated: boolean; escalationReason?: string }> {
  const normalized: NormalizedInboundMessage = {
    channel,
    providerMessageId: `demo_${randomUUID()}`,
    conversationKey: `${channel}:${externalId}`,
    account: { channelAccountId: "demo" },
    contact: { externalId, name, phone },
    content: { type: "text", text },
    timestamp: new Date().toISOString(),
    replyWindowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    tenantId,
  };

  const persistResult = await ingestInbound(normalized);
  if (persistResult.duplicated) {
    throw new Error(`Mensaje duplicado inesperado para ${externalId}`);
  }

  const agentResponse = await processMessage({
    tenantId,
    tenantSlug: TENANT_SLUG,
    conversationId: persistResult.conversationId,
    contactId: persistResult.contactId,
    contactName: name,
    text,
  });

  return {
    conversationId: persistResult.conversationId,
    contactId: persistResult.contactId,
    escalated: !!agentResponse.escalated,
    escalationReason: agentResponse.escalationReason,
  };
}

async function seedDemo() {
  console.log("🎭 Generando conversaciones de demo REALES (agente V2) para Santa María...\n");

  const [tenant] = await sql`SELECT id, slug FROM tenants WHERE slug = ${TENANT_SLUG} LIMIT 1`;
  if (!tenant) {
    console.error("❌ Tenant 'santa-maria' not found. Run seed.ts first.");
    process.exit(1);
  }
  const tenantId = tenant.id;
  await sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
  console.log(`✓ Tenant: ${tenant.slug} (${tenantId})`);

  // ── Limpiar datos demo existentes ──
  await sql`DELETE FROM bookings WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM conversation_state WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM messages WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM conversations WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM contacts WHERE tenant_id = ${tenantId}`;
  console.log("✓ Cleaned existing demo data\n");

  let i = 0;
  for (const persona of PERSONAS) {
    i++;
    const externalId = `demo-${persona.channel}-${i}`;
    console.log(`  [${i}/${PERSONAS.length}] ${persona.name} (${persona.channel}, ${persona.type})...`);

    let conversationId = "";
    let contactId = "";
    let escalated = false;
    let escalationReason: string | undefined;

    for (const text of persona.messages) {
      const r = await sendTurn(tenantId, persona.channel, externalId, persona.name, persona.phone, text);
      conversationId = r.conversationId;
      contactId = r.contactId;
      if (r.escalated) {
        escalated = true;
        escalationReason = r.escalationReason;
      }
    }

    // ── Retrasar la conversación en el tiempo (últimos 29 días, sesgo tarde-noche) ──
    const [{ min_created: actualStart }] = await sql`
      SELECT MIN(created_at) AS min_created FROM messages WHERE conversation_id = ${conversationId}
    `;
    const targetStart = randomDateWeighted(29);
    const deltaMs = targetStart.getTime() - new Date(actualStart).getTime();
    const deltaLiteral = `${deltaMs} milliseconds`;

    await sql`
      UPDATE messages SET created_at = created_at + ${deltaLiteral}::interval
      WHERE conversation_id = ${conversationId}
    `;
    await sql`
      UPDATE conversations
      SET created_at = created_at + ${deltaLiteral}::interval,
          last_message_at = last_message_at + ${deltaLiteral}::interval
      WHERE id = ${conversationId}
    `;

    // ── Estado + booking según el tipo de guión ──
    // El booking en sí lo crea el flow-adapter real (maybeCreateBooking) cuando
    // el usuario envía el comprobante de pago — aquí solo limpiamos el `datetime`
    // (el flow guarda el texto libre del usuario, ej. "el sábado a las 3pm") para
    // que quede una fecha real coherente con el resto del timeline del demo.
    if (persona.type === "booking") {
      const bookingDate = new Date(targetStart.getTime() + 2 * 24 * 60 * 60 * 1000);
      await sql`
        UPDATE bookings SET datetime = ${bookingDate.toISOString()}
        WHERE conversation_id = ${conversationId}
      `;
      await sql`UPDATE conversations SET status = 'closed' WHERE id = ${conversationId}`;
    } else if (persona.type === "escalation") {
      await sql`
        UPDATE conversations
        SET status = 'human_active', handoff_summary = ${escalationReason ?? "Requiere atención de un asesor humano."}
        WHERE id = ${conversationId}
      `;
    }
    // price_dropoff / faq: se quedan en 'bot_active' (default de ingestInbound) — conversación abierta.

    if (escalated && persona.type !== "escalation") {
      console.warn(`    ⚠️  ${persona.name} escaló inesperadamente (${escalationReason})`);
    }
  }

  // ── Resumen ──
  const [{ count: contacts }] = await sql`SELECT COUNT(*)::int AS count FROM contacts WHERE tenant_id = ${tenantId}`;
  const [{ count: conversations }] = await sql`SELECT COUNT(*)::int AS count FROM conversations WHERE tenant_id = ${tenantId}`;
  const [{ count: messages }] = await sql`SELECT COUNT(*)::int AS count FROM messages WHERE tenant_id = ${tenantId}`;
  const [{ count: bookings }] = await sql`SELECT COUNT(*)::int AS count FROM bookings WHERE tenant_id = ${tenantId}`;

  console.log(`\n📊 Demo seed summary (conversaciones generadas por el agente real):`);
  console.log(`  contacts:      ${contacts}`);
  console.log(`  conversations: ${conversations}`);
  console.log(`  messages:      ${messages}`);
  console.log(`  bookings:      ${bookings}`);
  console.log(`\n✅ Demo seed completed successfully!`);
  await sql.end();
}

seedDemo().catch((err) => {
  console.error("❌ Demo seed failed:", err);
  process.exit(1);
});
