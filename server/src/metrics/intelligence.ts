/**
 * Intelligence Metrics — calcula el shape DashboardData desde la DB real.
 *
 * Heurísticas y suposiciones del MVP:
 * - Período actual = últimos 30 días. Período anterior = 30 días antes de eso.
 * - "Ingreso potencial": conversaciones activas donde el flujo de agendamiento
 *   registró un `servicio` en slots, pero no hay booking. Se asume que el
 *   precio del servicio es el del catalog_items (match por nombre).
 * - "Dinero sobre la mesa": mismo cálculo pero filtrando conversaciones que
 *   llegaron a estado "precio" (pidieron precio pero no agendaron).
 * - Embudo: etapas determinadas por heurísticas de mensajes + booking status.
 * - Heatmap: mensajes inbound agrupados por día_semana × franja horaria.
 * - ROI: conversaciones resueltas sin escalar, mensajes fuera del horario
 *   definido en business_profile.hours.
 * - Horas ahorradas: outbound_messages_bot × 4 min (estimado de respuesta
 *   manual promedio) convertido a horas.
 */

import type postgres from "postgres";

// ─── Types (mismo shape que lib/dashboard-mock.ts) ───

export interface RevenueKpi {
  title: string;
  value: string;
  subtitle: string;
  trend: number;
  trendLabel: string;
  description: string;
}

export interface FunnelStep {
  label: string;
  count: number;
  dropPercent: number | null;
  isWorst?: boolean;
}

export interface ServiceDemand {
  name: string;
  price: number;
  inquiries: number;
  bookings: number;
  closeRate: number;
}

export interface HeatmapSlot {
  day: string;
  hour: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface BotRoi {
  resolvedPercent: number;
  resolvedCount: number;
  hoursSaved: number;
  afterHoursMessages: number;
  estimatedValue: number;
}

export interface RecentActivity {
  id: string;
  contact: string;
  avatar: string;
  channel: "whatsapp" | "instagram" | "facebook";
  status: "scheduled" | "in_progress" | "pending" | "escalated" | "lost";
  summary: string;
  time: string;
}

export interface DashboardData {
  kpis: RevenueKpi[];
  funnel: FunnelStep[];
  services: ServiceDemand[];
  heatmap: HeatmapSlot[];
  roi: BotRoi;
  recent: RecentActivity[];
}

// ─── Helpers ───

function formatShortCop(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

function formatCop(value: number): string {
  return `$${value.toLocaleString("es-CO")}`;
}

// Heurística: tiempo promedio de respuesta manual en minutos
const AVG_MANUAL_RESPONSE_MINUTES = 4;

// Franjas horarias del heatmap
const HEATMAP_HOURS = ["9-11", "11-13", "13-15", "15-17", "17-19", "19-21", "21-22:30"];
const HEATMAP_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function toHourSlot(t: Date): string {
  const h = t.getHours();
  if (h >= 9 && h < 11) return "9-11";
  if (h >= 11 && h < 13) return "11-13";
  if (h >= 13 && h < 15) return "13-15";
  if (h >= 15 && h < 17) return "15-17";
  if (h >= 17 && h < 19) return "17-19";
  if (h >= 19 && h < 21) return "19-21";
  return "21-22:30";
}

// Obtener el valor numérico de una hora de inicio de franja (para comparar con horario laboral)
function hourSlotStart(slot: string): number {
  return parseInt(slot.split("-")[0], 10);
}

/**
 * Calcula intensidad 0-4 distribuyendo los counts en 5 quintiles.
 * Si max === min, todos intensity 0.
 */
function computeIntensity(values: number[]): number[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return values.map(() => 0);
  const range = max - min;
  return values.map((v) => {
    if (v <= min + range * 0.2) return 0;
    if (v <= min + range * 0.4) return 1;
    if (v <= min + range * 0.6) return 2;
    if (v <= min + range * 0.8) return 3;
    return 4;
  }) as (0 | 1 | 2 | 3 | 4)[];
}

// ─── Main function ───

export async function computeIntelligence(
  sql: postgres.Sql,
  tenantId: string
): Promise<DashboardData> {
  // Fechas de período
  const now = new Date();
  const periodEnd = now.toISOString();
  const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const prevPeriodEnd = periodStart;
  const prevPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  // ─── Business profile hours ───
  const [profile] = await sql`
    SELECT hours FROM business_profile WHERE tenant_id = ${tenantId} LIMIT 1
  `;
  const profileHours: Record<string, string> = profile?.hours ?? {};
  // Fallback: horario por defecto 9:00-22:30
  const businessStartHour = 9;
  const businessEndHour = 22; // 22:30

  // ─── KPIs ───

  // (a) Ingreso potencial: catalog_items.price de servicios mencionados en
  // conversation_state.slots (servicio) en conversaciones activas SIN booking
  const potentialRevenueRows = await sql`
    SELECT COALESCE(SUM(ci.price), 0) AS total, COUNT(DISTINCT cs.conversation_id)::int AS conv_count
    FROM conversation_state cs
    JOIN catalog_items ci ON ci.tenant_id = ${tenantId}
      AND ci.is_active = 1
      AND (cs.slots->>'servicio') ILIKE '%' || ci.name || '%'
    WHERE cs.tenant_id = ${tenantId}
      AND cs.current_state NOT IN ('done', 'cancelled')
      AND NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.tenant_id = ${tenantId}
          AND b.conversation_id = cs.conversation_id
      )
  `;
  const potentialTotal = parseFloat(String(potentialRevenueRows[0]?.total ?? 0));
  const potentialConvs = potentialRevenueRows[0]?.conv_count ?? 0;

  // Período anterior para trend
  const potentialPrev = await sql`
    SELECT COALESCE(SUM(ci.price), 0) AS total
    FROM conversation_state cs
    JOIN catalog_items ci ON ci.tenant_id = ${tenantId}
      AND ci.is_active = 1
      AND (cs.slots->>'servicio') ILIKE '%' || ci.name || '%'
    WHERE cs.tenant_id = ${tenantId}
      AND cs.created_at >= ${prevPeriodStart}::timestamp
      AND cs.created_at < ${periodStart}::timestamp
      AND cs.current_state NOT IN ('done', 'cancelled')
      AND NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.tenant_id = ${tenantId}
          AND b.conversation_id = cs.conversation_id
      )
  `;
  const potentialPrevTotal = parseFloat(String(potentialPrev[0]?.total ?? 0));

  // (b) Citas agendadas en $: bookings con status scheduled/confirmed del período
  const bookedRows = await sql`
    SELECT
      COALESCE(SUM(b.service_price::numeric), 0) AS total,
      COUNT(*)::int AS count
    FROM bookings b
    WHERE b.tenant_id = ${tenantId}
      AND b.status IN ('scheduled', 'confirmed')
      AND b.created_at >= ${periodStart}::timestamp
      AND b.created_at <= ${periodEnd}::timestamp
  `;
  const bookedTotal = parseFloat(String(bookedRows[0]?.total ?? 0));
  const bookedCount = bookedRows[0]?.count ?? 0;

  const bookedPrev = await sql`
    SELECT COALESCE(SUM(b.service_price::numeric), 0) AS total
    FROM bookings b
    WHERE b.tenant_id = ${tenantId}
      AND b.status IN ('scheduled', 'confirmed')
      AND b.created_at >= ${prevPeriodStart}::timestamp
      AND b.created_at < ${periodStart}::timestamp
  `;
  const bookedPrevTotal = parseFloat(String(bookedPrev[0]?.total ?? 0));

  // (c) Dinero sobre la mesa: conversaciones que pidieron precio (intent en conversation_state
  // o flow_key contiene 'precio') pero no agendaron
  const moneyOnTableRows = await sql`
    SELECT COALESCE(SUM(ci.price), 0) AS total, COUNT(DISTINCT cs.conversation_id)::int AS conv_count
    FROM conversation_state cs
    JOIN catalog_items ci ON ci.tenant_id = ${tenantId}
      AND ci.is_active = 1
      AND (cs.slots->>'servicio') ILIKE '%' || ci.name || '%'
    WHERE cs.tenant_id = ${tenantId}
      AND cs.current_state IN ('precio', 'asking_price')
      AND NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.tenant_id = ${tenantId}
          AND b.conversation_id = cs.conversation_id
      )
  `;
  const moneyTotal = parseFloat(String(moneyOnTableRows[0]?.total ?? 0));
  const moneyConvs = moneyOnTableRows[0]?.conv_count ?? 0;

  const moneyPrev = await sql`
    SELECT COALESCE(SUM(ci.price), 0) AS total
    FROM conversation_state cs
    JOIN catalog_items ci ON ci.tenant_id = ${tenantId}
      AND ci.is_active = 1
      AND (cs.slots->>'servicio') ILIKE '%' || ci.name || '%'
    WHERE cs.tenant_id = ${tenantId}
      AND cs.created_at >= ${prevPeriodStart}::timestamp
      AND cs.created_at < ${periodStart}::timestamp
      AND cs.current_state IN ('precio', 'asking_price')
      AND NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.tenant_id = ${tenantId}
          AND b.conversation_id = cs.conversation_id
      )
  `;
  const moneyPrevTotal = parseFloat(String(moneyPrev[0]?.total ?? 0));

  // Calcular trends (porcentaje de cambio)
  const trend = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const potentialTrend = trend(potentialTotal, potentialPrevTotal);
  const bookedTrend = trend(bookedTotal, bookedPrevTotal);
  const moneyTrend = trend(moneyTotal, moneyPrevTotal);

  const kpis: RevenueKpi[] = [
    {
      title: "Ingreso potencial en conversaciones activas",
      value: formatShortCop(potentialTotal),
      subtitle: `${formatCop(potentialTotal)} COP en ${potentialConvs} conversaciones`,
      trend: potentialTrend,
      trendLabel: "vs mes anterior",
      description: "Suma de servicios consultados pero aún no agendados",
    },
    {
      title: "Citas agendadas este mes",
      value: formatShortCop(bookedTotal),
      subtitle: `${bookedCount} citas · ${formatCop(bookedTotal)} COP`,
      trend: bookedTrend,
      trendLabel: "vs mes anterior",
      description: "Valor total de citas confirmadas en el período actual",
    },
    {
      title: "Dinero sobre la mesa",
      value: formatShortCop(moneyTotal),
      subtitle: `${formatCop(moneyTotal)} COP sin cerrar · ${moneyConvs} conversaciones`,
      trend: moneyTrend,
      trendLabel: "vs mes anterior",
      description: "Leads que pidieron precio pero no agendaron — oportunidad de seguimiento",
    },
  ];

  // ─── Funnel ───

  // Etapa 1: Todas las conversaciones con al menos 1 mensaje inbound
  const [funnel1] = await sql`
    SELECT COUNT(DISTINCT c.id)::int AS count
    FROM conversations c
    WHERE c.tenant_id = ${tenantId}
      AND EXISTS (
        SELECT 1 FROM messages m
        WHERE m.conversation_id = c.id AND m.tenant_id = ${tenantId} AND m.direction = 'inbound'
      )
  `;

  // Etapa 2: Conversaciones con más de 1 intercambio (inbound+outbound)
  const [funnel2] = await sql`
    SELECT COUNT(DISTINCT c.id)::int AS count
    FROM conversations c
    WHERE c.tenant_id = ${tenantId}
      AND (
        SELECT COUNT(*) FROM messages m
        WHERE m.conversation_id = c.id AND m.tenant_id = ${tenantId}
      ) >= 2
      AND EXISTS (
        SELECT 1 FROM messages m
        WHERE m.conversation_id = c.id AND m.tenant_id = ${tenantId} AND m.direction = 'outbound'
      )
  `;

  // Etapa 3: Conversaciones que pidieron precio
  // Heurística: conversation_state con current_state que contenga 'precio' O
  // mensajes inbound que mencionen "cuánto", "precio", "cuesta", "tarifa", "valor"
  const [funnel3] = await sql`
    SELECT COUNT(DISTINCT c.id)::int AS count
    FROM conversations c
    WHERE c.tenant_id = ${tenantId}
      AND (
        EXISTS (
          SELECT 1 FROM conversation_state cs
          WHERE cs.conversation_id = c.id AND cs.tenant_id = ${tenantId}
            AND (cs.current_state ILIKE '%precio%' OR cs.flow_key ILIKE '%precio%')
        )
        OR EXISTS (
          SELECT 1 FROM messages m
          WHERE m.conversation_id = c.id AND m.tenant_id = ${tenantId}
            AND m.direction = 'inbound'
            AND (m.text ILIKE '%cuánto%' OR m.text ILIKE '%precio%' OR m.text ILIKE '%cuesta%'
              OR m.text ILIKE '%tarifa%' OR m.text ILIKE '%valor%' OR m.text ILIKE '%costo%')
        )
      )
  `;

  // Etapa 4: Conversaciones con booking
  const [funnel4] = await sql`
    SELECT COUNT(DISTINCT b.conversation_id)::int AS count
    FROM bookings b
    WHERE b.tenant_id = ${tenantId}
  `;

  // Etapa 5: Booking confirmados
  const [funnel5] = await sql`
    SELECT COUNT(DISTINCT b.conversation_id)::int AS count
    FROM bookings b
    WHERE b.tenant_id = ${tenantId} AND b.status = 'confirmed'
  `;

  const f1 = funnel1?.count ?? 0;
  const f2 = funnel2?.count ?? 0;
  const f3 = funnel3?.count ?? 0;
  const f4 = funnel4?.count ?? 0;
  const f5 = funnel5?.count ?? 0;

  const dropPct = (prev: number, curr: number): number | null => {
    if (prev === 0) return null;
    return Math.round(((prev - curr) / prev) * 100);
  };

  const drops = [dropPct(f1, f2), dropPct(f2, f3), dropPct(f3, f4), dropPct(f4, f5)];
  // Encontrar el peor drop (mayor porcentaje de caída)
  let worstIdx = -1;
  let worstVal = -1;
  drops.forEach((d, i) => {
    if (d !== null && d > worstVal) {
      worstVal = d;
      worstIdx = i;
    }
  });

  const funnel: FunnelStep[] = [
    { label: "Mensajes recibidos", count: f1, dropPercent: null },
    { label: "Mostraron interés", count: f2, dropPercent: drops[0], isWorst: worstIdx === 0 },
    { label: "Pidieron precio", count: f3, dropPercent: drops[1], isWorst: worstIdx === 1 },
    { label: "Agendaron cita", count: f4, dropPercent: drops[2], isWorst: worstIdx === 2 },
    { label: "Confirmaron pago", count: f5, dropPercent: drops[3], isWorst: worstIdx === 3 },
  ];

  // ─── Services (demanda por servicio) ───

  // Para cada catalog_item activo:
  // - inquiries: conversaciones que mencionaron el servicio (por slots o texto en mensajes)
  // - bookings: bookings con service_name similar al item
  const serviceRows = await sql`
    SELECT
      ci.name,
      ci.price::numeric,
      (
        SELECT COUNT(DISTINCT cs.conversation_id)::int
        FROM conversation_state cs
        WHERE cs.tenant_id = ${tenantId}
          AND (cs.slots->>'servicio') ILIKE '%' || ci.name || '%'
      ) + (
        SELECT COUNT(DISTINCT m.conversation_id)::int
        FROM messages m
        WHERE m.tenant_id = ${tenantId}
          AND m.direction = 'inbound'
          AND m.text ILIKE '%' || ci.name || '%'
      ) AS inquiries,
      (
        SELECT COUNT(*)::int
        FROM bookings b
        WHERE b.tenant_id = ${tenantId}
          AND b.service_name ILIKE '%' || ci.name || '%'
          AND b.status IN ('scheduled', 'confirmed')
      ) AS bookings
    FROM catalog_items ci
    WHERE ci.tenant_id = ${tenantId} AND ci.is_active = 1
    ORDER BY inquiries DESC
  `;

  const services: ServiceDemand[] = serviceRows.map((r: any) => {
    const inquiries = r.inquiries ?? 0;
    const bookings = r.bookings ?? 0;
    return {
      name: r.name,
      price: parseFloat(String(r.price ?? 0)),
      inquiries,
      bookings,
      closeRate: inquiries > 0 ? Math.round((bookings / inquiries) * 1000) / 10 : 0,
    };
  });

  // ─── Heatmap ───

  const heatmapRaw = await sql`
    SELECT
      EXTRACT(DOW FROM m.created_at)::int AS dow,
      EXTRACT(HOUR FROM m.created_at)::int AS hour,
      COUNT(*)::int AS count
    FROM messages m
    WHERE m.tenant_id = ${tenantId}
      AND m.direction = 'inbound'
      AND m.created_at >= ${periodStart}::timestamp
    GROUP BY dow, hour
    ORDER BY dow, hour
  `;

  // Construir heatmap grid
  const heatmapCounts: number[] = [];
  const heatmapEntries: { day: string; hour: string; count: number }[] = [];

  for (const dayName of HEATMAP_DAYS) {
    for (const hourSlot of HEATMAP_HOURS) {
      const dow = HEATMAP_DAYS.indexOf(dayName);
      const hourStart = hourSlotStart(hourSlot);
      // Buscar datos agregados que caigan en esta franja
      let totalForSlot = 0;
      for (const row of heatmapRaw) {
        const rowDow = row.dow;
        const rowHour = row.hour;
        // Map PostgreSQL DOW (0=Sunday) to our index
        const pgDow = (rowDow + 6) % 7; // Convert: DOW 0(Dom)=6 in our 0(Lun)
        // Re-map: our DAYS = [Lun(0), Mar(1), Mié(2), Jue(3), Vie(4), Sáb(5), Dom(6)]
        // PG DOW: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
        // mapped = (pgDow + 6) % 7: 0->6, 1->0, 2->1, 3->2, 4->3, 5->4, 6->5
        const mappedDow = (pgDow + 6) % 7;
        if (mappedDow === dow && rowHour >= hourStart && rowHour < hourStart + 2) {
          totalForSlot += row.count;
        }
      }
      heatmapCounts.push(totalForSlot);
      heatmapEntries.push({ day: dayName, hour: hourSlot, count: totalForSlot });
    }
  }

  const intensities = computeIntensity(heatmapCounts);

  const heatmap: HeatmapSlot[] = heatmapEntries.map((entry, i) => ({
    day: entry.day,
    hour: entry.hour,
    count: entry.count,
    intensity: intensities[i] as 0 | 1 | 2 | 3 | 4,
  }));

  // ─── ROI ───

  // Conversaciones resueltas sin humana: aquellas con status 'closed' o 'bot_active'
  // que NUNCA estuvieron en estado human_active o escalated
  const [roiResolved] = await sql`
    SELECT COUNT(*)::int AS total
    FROM conversations c
    WHERE c.tenant_id = ${tenantId}
      AND c.status IN ('closed', 'bot_active')
      AND NOT EXISTS (
        SELECT 1 FROM conversation_state cs
        WHERE cs.conversation_id = c.id AND cs.tenant_id = ${tenantId}
          AND cs.current_state IN ('human_active', 'escalated')
      )
  `;

  const [roiTotal] = await sql`
    SELECT COUNT(*)::int AS total
    FROM conversations c
    WHERE c.tenant_id = ${tenantId}
  `;

  const resolvedCount = roiResolved?.total ?? 0;
  const totalConvs = roiTotal?.total ?? 0;
  const resolvedPercent = totalConvs > 0 ? Math.round((resolvedCount / totalConvs) * 100) : 0;

  // Horas ahorradas: mensajes outbound del bot × AVG_MANUAL_RESPONSE_MINUTES / 60
  const [botOutbound] = await sql`
    SELECT COUNT(*)::int AS count
    FROM messages m
    WHERE m.tenant_id = ${tenantId}
      AND m.direction = 'outbound'
      AND m.sender_type = 'bot'
      AND m.created_at >= ${periodStart}::timestamp
  `;
  const botOutboundCount = botOutbound?.count ?? 0;
  const hoursSaved = Math.round((botOutboundCount * AVG_MANUAL_RESPONSE_MINUTES) / 60);

  // Mensajes fuera de horario: inbound recibidos fuera del horario del business_profile
  // Si no hay profile, usa 9:00-22:30 por defecto
  const [afterHours] = await sql`
    SELECT COUNT(*)::int AS count
    FROM messages m
    WHERE m.tenant_id = ${tenantId}
      AND m.direction = 'inbound'
      AND m.created_at >= ${periodStart}::timestamp
      AND (
        EXTRACT(HOUR FROM m.created_at) < ${businessStartHour}
        OR EXTRACT(HOUR FROM m.created_at) >= ${businessEndHour}
      )
  `;
  const afterHoursCount = afterHours?.count ?? 0;

  // Valor estimado: horas ahorradas × valor hora de un asistente (~$20K COP/hora para MVP)
  const HOURLY_RATE = 120_000; // COP — estimación conservadora
  const estimatedValue = hoursSaved * HOURLY_RATE;

  const roi: BotRoi = {
    resolvedPercent,
    resolvedCount,
    hoursSaved,
    afterHoursMessages: afterHoursCount,
    estimatedValue,
  };

  // ─── Recent Activity ───

  const recentRaw = await sql`
    SELECT
      c.id,
      ct.name AS contact_name,
      ca.channel,
      c.status,
      (SELECT text FROM messages m WHERE m.conversation_id = c.id AND m.tenant_id = ${tenantId} ORDER BY m.created_at DESC LIMIT 1) AS last_message,
      c.last_message_at
    FROM conversations c
    JOIN contacts ct ON ct.id = c.contact_id
    JOIN channel_accounts ca ON ca.id = c.channel_account_id
    WHERE c.tenant_id = ${tenantId}
    ORDER BY c.last_message_at DESC NULLS LAST
    LIMIT 6
  `;

  const statusToActivityStatus: Record<string, "scheduled" | "in_progress" | "pending" | "escalated" | "lost"> = {
    bot_active: "in_progress",
    human_active: "in_progress",
    escalated: "escalated",
    closed: "lost",
  };

  const channelMap: Record<string, "whatsapp" | "instagram" | "facebook"> = {
    whatsapp: "whatsapp",
    instagram: "instagram",
    messenger: "facebook",
    mock: "whatsapp",
  };

  const recent: RecentActivity[] = recentRaw.map((r: any) => ({
    id: r.id,
    contact: r.contact_name ?? "Desconocido",
    avatar: (r.contact_name ?? "??").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase(),
    channel: channelMap[r.channel] ?? "whatsapp",
    status: statusToActivityStatus[r.status] ?? "pending",
    summary: (r.last_message ?? "").slice(0, 60),
    time: r.last_message_at ? new Date(r.last_message_at).toISOString() : new Date().toISOString(),
  }));

  return {
    kpis,
    funnel,
    services,
    heatmap,
    roi,
    recent,
  };
}
