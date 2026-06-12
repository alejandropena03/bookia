import { db, queryClient } from "./client.js";
import { tenants, channelAccounts, businessProfile, catalogItems, flows, users } from "./schema.js";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding Bookia database...\n");

  // ── 1. Tenant: Santa María ──
  const [tenant] = await db.insert(tenants).values({
    name: "Santa María Clínica Estética",
    slug: "santa-maria",
    status: "active",
  }).returning();
  console.log(`✓ Tenant created: ${tenant.name} (${tenant.id})`);

  // Set GUC for RLS (tenants table has no RLS, but business tables do with FORCE RLS)
  await queryClient`SELECT set_config('app.current_tenant', ${tenant.id}, true)`;
  console.log(`  → app.current_tenant set to ${tenant.id}`);

  // ── 2. Channel account: mock (demo sin credenciales) ──
  const [channelAccount] = await db.insert(channelAccounts).values({
    tenantId: tenant.id,
    channel: "mock",
    mode: "mock",
    externalAccountId: "demo-mock-001",
    status: "connected",
  }).returning();
  console.log(`✓ Channel account created: ${channelAccount.channel} (mock)`);

  // ── 3. Business profile: placeholder ──
  const [profile] = await db.insert(businessProfile).values({
    tenantId: tenant.id,
    persona: "Asistente virtual amable y profesional de una clínica de estética. Tono cálido y cercano. Usa el nombre del cliente. Responde con claridad y empatía. No uses jerga médica técnica a menos que el cliente la use primero.",
    rules: {
      escalation: [
        { keyword: "emergencia", reason: "Cliente menciona emergencia o reacción adversa", notify: true },
        { keyword: "reacción", reason: "Cliente menciona reacción adversa", notify: true },
        { keyword: "alergia", reason: "Cliente menciona reacción alérgica", notify: true },
        { keyword: "humano", reason: "Cliente pide explícitamente hablar con un humano", notify: true },
        { keyword: "insatisfecho", reason: "Cliente se muestra molesto o insatisfecho", notify: true },
        { keyword: "descuento", reason: "Cliente pide descuento o promoción no listada", notify: true },
        { keyword: "técnico", reason: "Cliente pregunta algo técnico/médico fuera del catálogo", notify: true },
        { keyword: "médico", reason: "Cliente pregunta algo técnico/médico fuera del catálogo", notify: true },
      ],
      no_decir: [
        "diagnósticos médicos",
        "recomendaciones médicas personalizadas",
        "precios que no estén en el catálogo",
        "promesas de resultados",
      ],
    },
    hours: {
      lunes: { open: "09:00", close: "22:30" },
      martes: { open: "09:00", close: "22:30" },
      miércoles: { open: "09:00", close: "22:30" },
      jueves: { open: "09:00", close: "22:30" },
      viernes: { open: "09:00", close: "22:30" },
      sábado: { open: "09:00", close: "22:30" },
      domingo: { open: null, close: null },
    },
    systemPromptOverrides: null,
    cannedResponses: {},
    offHoursMessage: "Gracias por escribirnos. Nuestro horario de atención es de lunes a sábado de 9:00 a 22:30. Te responderemos apenas estemos disponibles.",
  }).returning();
  console.log(`✓ Business profile created`);

  // ── 4. Catalog items: placeholder (5 servicios genéricos) ──
  const catalogSeed = [
    { name: "Servicio A — Consulta", description: "Consulta inicial con nuestros especialistas. Evaluación personalizada.", price: "100000", category: "consultas", durationMinutes: 30 },
    { name: "Servicio B — Tratamiento facial", description: "Tratamiento facial rejuvenecedor. Resultados visibles desde la primera sesión.", price: "250000", category: "tratamientos", durationMinutes: 60 },
    { name: "Servicio C — Depilación láser", description: "Sesión de depilación láser en zona a definir.", price: "180000", category: "depilación", durationMinutes: 45 },
    { name: "Servicio D — Masaje relajante", description: "Masaje corporal completo de relajación muscular.", price: "150000", category: "masajes", durationMinutes: 60 },
    { name: "Paquete E — Plan bienestar", description: "Paquete de 5 sesiones de tratamiento facial + 2 masajes.", price: "1200000", category: "paquetes", durationMinutes: null },
  ];

  for (const item of catalogSeed) {
    await db.insert(catalogItems).values({
      tenantId: tenant.id,
      ...item,
      currency: "COP",
      isActive: 1,
    });
  }
  console.log(`✓ ${catalogSeed.length} catalog items created`);

  // ── 5. Flow: agendamiento placeholder ──
  // State-machine shape:
  //   initial: estado inicial
  //   states: { [state]: { prompt, collects, next, transitions } }
  const flowDefinition = {
    initial: "ask_city",
    states: {
      ask_city: {
        prompt: "¡Hola {nombre}! ¿De qué ciudad nos escribes?",
        collects: "city",
        next: "show_service",
        description: "Preguntar la ciudad del cliente para dirigirlo a la sede correspondiente",
      },
      show_service: {
        prompt: "Tenemos estos servicios disponibles en {city}:\n{catalog_list}\n\n¿Cuál te interesa?",
        collects: "service",
        next: "confirm_service",
        description: "Mostrar catálogo de servicios filtrado por ciudad y preguntar cuál le interesa",
      },
      confirm_service: {
        prompt: "Entendido, {nombre}. Has elegido: {service_name} ({service_price}).\n¿Te gustaría agendar una cita?",
        collects: "confirmation",
        transitions: {
          si: "ask_datetime",
          no: "farewell",
        },
        description: "Confirmar con el cliente si desea agendar el servicio seleccionado",
      },
      ask_datetime: {
        prompt: "Perfecto. ¿Qué día y hora te gustaría agendar?",
        collects: "datetime",
        next: "payment_instructions",
        description: "Preguntar fecha y hora deseada para la cita",
      },
      payment_instructions: {
        prompt: "Para confirmar tu cita del {datetime}, realizamos el pago anticipado del {service_price}.\n\n💰 Puedes pagar por:\n1. Transferencia bancaria (Nequi: 300xxxxxxx)\n2. Tarjeta de crédito/débito (enviamos link de pago)\n\n¿Cómo prefieres pagar?",
        collects: "payment_method",
        next: "await_proof",
        description: "Dar instrucciones de pago según el servicio seleccionado",
      },
      await_proof: {
        prompt: "¡Gracias! Una vez realices el pago, por favor envíanos el comprobante por este medio y confirmaremos tu cita.",
        collects: "payment_proof",
        next: "collect_data",
        description: "Esperar que el cliente envíe el comprobante de pago",
      },
      collect_data: {
        prompt: "¡Gracias por tu comprobante! Para confirmar la cita, necesitamos:\n- Nombre completo\n- Número de contacto\n- Correo electrónico (opcional)",
        collects: "client_data",
        next: "confirm_booking",
        description: "Recolectar datos personales del cliente para crear la cita en Agenda Pro",
      },
      confirm_booking: {
        prompt: "✅ ¡Cita confirmada!\n\n{client_name}, tu cita de {service_name} queda agendada para el {datetime} en nuestra sede.\n\nTe enviaremos un recordatorio 24 horas antes.\n\n¿Hay algo más en que pueda ayudarte?",
        collects: null,
        next: "farewell",
        description: "Confirmar la cita con todos los datos y finalizar el flujo",
      },
      farewell: {
        prompt: "¡Gracias por contactarnos, {nombre}! Que tengas un excelente día. 😊\n\nSi necesitas algo más, aquí estaremos para ayudarte.",
        collects: null,
        next: null,
        description: "Despedida del flujo, conversación vuelve a modo abierto",
      },
    },
  };

  await db.insert(flows).values({
    tenantId: tenant.id,
    key: "agendamiento",
    name: "Flujo de agendamiento de citas",
    definition: flowDefinition as unknown as Record<string, unknown>,
    isActive: 1,
    version: 1,
  });
  console.log('✓ Flow "agendamiento" created');

  // ── 6. Flow: first_contact (saludo + menú) ──
  const firstContactDef = {
    initial: "saludo",
    states: {
      saludo: {
        prompt: "¡Hola {nombre}! Soy Sofía, tu asistente virtual de Santa María Clínica Estética. 😊\n\n¿En qué puedo ayudarte hoy? Estas son algunas opciones:\n\n1. 📋 **Ver servicios y precios**\n2. 📅 **Agendar una cita**\n3. 🕐 **Conocer nuestros horarios**\n4. 💬 **Hablar con un asesor**\n\nO simplemente escríbeme lo que necesitas.",
        collects: null,
        next: null,
        description: "Saludo inicial con menú de opciones",
      },
    },
  };

  await db.insert(flows).values({
    tenantId: tenant.id,
    key: "first_contact",
    name: "Saludo inicial y menú de opciones",
    definition: firstContactDef as unknown as Record<string, unknown>,
    isActive: 1,
    version: 1,
  });
  console.log('✓ Flow "first_contact" created');

  // ── 7. User: owner placeholder ──
  const [owner] = await db.insert(users).values({
    tenantId: tenant.id,
    email: "admin@santamaria.test",
    name: "Admin Santa María",
    role: "owner",
  }).returning();
  console.log(`✓ Owner user created: ${owner.name}`);

  // ── Summary ──
  console.log("\n📊 Seed summary:");
  const [{ count: t }] = await db.execute(sql`SELECT COUNT(*)::text AS count FROM tenants`);
  const [{ count: ca }] = await db.execute(sql`SELECT COUNT(*)::text AS count FROM channel_accounts`);
  const [{ count: bp }] = await db.execute(sql`SELECT COUNT(*)::text AS count FROM business_profile`);
  const [{ count: ci }] = await db.execute(sql`SELECT COUNT(*)::text AS count FROM catalog_items`);
  const [{ count: f }] = await db.execute(sql`SELECT COUNT(*)::text AS count FROM flows`);
  const [{ count: u }] = await db.execute(sql`SELECT COUNT(*)::text AS count FROM users`);
  console.log(`  tenants: ${t}`);
  console.log(`  channel_accounts: ${ca}`);
  console.log(`  business_profile: ${bp}`);
  console.log(`  catalog_items: ${ci}`);
  console.log(`  flows: ${f}`);
  console.log(`  users: ${u}`);

  console.log("\n✅ Seed completed successfully!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
