/* ──────────────────────────────────────────────────────────────
   MOCK DATA — Dashboard de inteligencia Bookia
   Cliente: Estética Santa María (Bogotá)
   Propósito: simula 30 días de datos realistas para el MVP.
   SHAPE documentado para que el backend lo calcule igual después.
   ────────────────────────────────────────────────────────────── */

function formatShortCOP(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export interface RevenueKpi {
  title: string
  value: string
  subtitle: string
  trend: number
  trendLabel: string
  description: string
}

export interface FunnelStep {
  label: string
  count: number
  dropPercent: number | null
  isWorst?: boolean
}

export interface ServiceDemand {
  name: string
  price: number
  inquiries: number
  bookings: number
  closeRate: number
}

export interface HeatmapSlot {
  day: string
  hour: string
  count: number
  intensity: 0 | 1 | 2 | 3 | 4
}

export interface BotRoi {
  resolvedPercent: number
  resolvedCount: number
  hoursSaved: number
  afterHoursMessages: number
  estimatedValue: number
}

export interface RecentActivity {
  id: string
  contact: string
  avatar: string
  channel: "whatsapp" | "instagram" | "facebook"
  status: "scheduled" | "in_progress" | "pending" | "escalated" | "lost"
  summary: string
  time: string
}

export type PeriodComparison = "vs_periodo_anterior"

export interface DashboardData {
  kpis: RevenueKpi[]
  funnel: FunnelStep[]
  services: ServiceDemand[]
  heatmap: HeatmapSlot[]
  roi: BotRoi
  recent: RecentActivity[]
  _shape_doc: string
}

export function getDashboardData(): DashboardData {
  return {
    kpis: [
      {
        title: "Ingreso potencial en conversaciones activas",
        value: formatShortCOP(4_200_000),
        subtitle: "$4.200.000 COP en juego",
        trend: 12,
        trendLabel: "vs mes anterior",
        description: "Suma de servicios consultados pero aún no agendados",
      },
      {
        title: "Citas agendadas este mes",
        value: formatShortCOP(8_700_000),
        subtitle: "34 citas · $8.700.000 COP",
        trend: 8,
        trendLabel: "vs mes anterior",
        description: "Valor total de citas confirmadas en el período actual",
      },
      {
        title: "Dinero sobre la mesa",
        value: formatShortCOP(2_100_000),
        subtitle: "$2.100.000 COP sin cerrar",
        trend: -5,
        trendLabel: "vs mes anterior",
        description: "Leads que pidieron precio pero no agendaron — oportunidad de seguimiento",
      },
    ],

    funnel: [
      { label: "Mensajes recibidos", count: 1410, dropPercent: null },
      { label: "Mostraron interés", count: 987, dropPercent: 30 },
      { label: "Pidieron precio", count: 423, dropPercent: 57, isWorst: true },
      { label: "Agendaron cita", count: 89, dropPercent: 79 },
      { label: "Confirmaron pago", count: 67, dropPercent: 25 },
    ],

    services: [
      { name: "Depilación láser", price: 350_000, inquiries: 187, bookings: 21, closeRate: 11.2 },
      { name: "Consulta dermatológica", price: 150_000, inquiries: 142, bookings: 34, closeRate: 23.9 },
      { name: "Limpieza facial profunda", price: 280_000, inquiries: 98, bookings: 18, closeRate: 18.4 },
      { name: "Masaje relajante", price: 200_000, inquiries: 76, bookings: 12, closeRate: 15.8 },
      { name: "Paquete Premium (4 sesiones)", price: 650_000, inquiries: 34, bookings: 4, closeRate: 11.8 },
    ],

    heatmap: [
      { day: "Lun", hour: "9-11", count: 23, intensity: 2 },
      { day: "Lun", hour: "11-13", count: 41, intensity: 3 },
      { day: "Lun", hour: "13-15", count: 18, intensity: 1 },
      { day: "Lun", hour: "15-17", count: 35, intensity: 2 },
      { day: "Lun", hour: "17-19", count: 52, intensity: 4 },
      { day: "Lun", hour: "19-21", count: 38, intensity: 3 },
      { day: "Lun", hour: "21-22:30", count: 12, intensity: 1 },
      { day: "Mar", hour: "9-11", count: 19, intensity: 1 },
      { day: "Mar", hour: "11-13", count: 45, intensity: 3 },
      { day: "Mar", hour: "13-15", count: 22, intensity: 2 },
      { day: "Mar", hour: "15-17", count: 31, intensity: 2 },
      { day: "Mar", hour: "17-19", count: 48, intensity: 3 },
      { day: "Mar", hour: "19-21", count: 42, intensity: 3 },
      { day: "Mar", hour: "21-22:30", count: 15, intensity: 1 },
      { day: "Mié", hour: "9-11", count: 27, intensity: 2 },
      { day: "Mié", hour: "11-13", count: 38, intensity: 3 },
      { day: "Mié", hour: "13-15", count: 20, intensity: 1 },
      { day: "Mié", hour: "15-17", count: 29, intensity: 2 },
      { day: "Mié", hour: "17-19", count: 55, intensity: 4 },
      { day: "Mié", hour: "19-21", count: 44, intensity: 3 },
      { day: "Mié", hour: "21-22:30", count: 10, intensity: 1 },
      { day: "Jue", hour: "9-11", count: 31, intensity: 2 },
      { day: "Jue", hour: "11-13", count: 42, intensity: 3 },
      { day: "Jue", hour: "13-15", count: 16, intensity: 1 },
      { day: "Jue", hour: "15-17", count: 37, intensity: 3 },
      { day: "Jue", hour: "17-19", count: 61, intensity: 4 },
      { day: "Jue", hour: "19-21", count: 47, intensity: 3 },
      { day: "Jue", hour: "21-22:30", count: 14, intensity: 1 },
      { day: "Vie", hour: "9-11", count: 36, intensity: 3 },
      { day: "Vie", hour: "11-13", count: 52, intensity: 4 },
      { day: "Vie", hour: "13-15", count: 28, intensity: 2 },
      { day: "Vie", hour: "15-17", count: 43, intensity: 3 },
      { day: "Vie", hour: "17-19", count: 58, intensity: 4 },
      { day: "Vie", hour: "19-21", count: 39, intensity: 3 },
      { day: "Vie", hour: "21-22:30", count: 18, intensity: 1 },
      { day: "Sáb", hour: "9-11", count: 14, intensity: 1 },
      { day: "Sáb", hour: "11-13", count: 25, intensity: 2 },
      { day: "Sáb", hour: "13-15", count: 11, intensity: 1 },
      { day: "Sáb", hour: "15-17", count: 19, intensity: 1 },
      { day: "Sáb", hour: "17-19", count: 22, intensity: 2 },
      { day: "Sáb", hour: "19-21", count: 16, intensity: 1 },
      { day: "Sáb", hour: "21-22:30", count: 5, intensity: 0 },
      { day: "Dom", hour: "9-11", count: 8, intensity: 0 },
      { day: "Dom", hour: "11-13", count: 12, intensity: 1 },
      { day: "Dom", hour: "13-15", count: 6, intensity: 0 },
      { day: "Dom", hour: "15-17", count: 10, intensity: 1 },
      { day: "Dom", hour: "17-19", count: 14, intensity: 1 },
      { day: "Dom", hour: "19-21", count: 7, intensity: 0 },
      { day: "Dom", hour: "21-22:30", count: 3, intensity: 0 },
    ],

    roi: {
      resolvedPercent: 73,
      resolvedCount: 1028,
      hoursSaved: 47,
      afterHoursMessages: 234,
      estimatedValue: 5_600_000,
    },

    recent: [
      { id: "c1", contact: "María López", avatar: "ML", channel: "whatsapp", status: "scheduled", summary: "Agendó depilación láser para el sábado", time: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: "c2", contact: "Carolina Rojas", avatar: "CR", channel: "instagram", status: "escalated", summary: "Preguntó por precios de paquete — escaló a humana", time: new Date(Date.now() - 17 * 60000).toISOString() },
      { id: "c3", contact: "Andrea Gómez", avatar: "AG", channel: "whatsapp", status: "in_progress", summary: "Consultando horarios para facial", time: new Date(Date.now() - 34 * 60000).toISOString() },
      { id: "c4", contact: "Daniela Pérez", avatar: "DP", channel: "facebook", status: "scheduled", summary: "Reservó consulta dermatológica", time: new Date(Date.now() - 62 * 60000).toISOString() },
      { id: "c5", contact: "Valentina Suárez", avatar: "VS", channel: "whatsapp", status: "pending", summary: "Pidió precio de masaje relajante", time: new Date(Date.now() - 125 * 60000).toISOString() },
      { id: "c6", contact: "Fernanda Díaz", avatar: "FD", channel: "instagram", status: "in_progress", summary: "Envió fotos de su piel, preguntando por tratamiento", time: new Date(Date.now() - 195 * 60000).toISOString() },
    ],

    _shape_doc: `
      SHAPE DOCUMENTATION — para implementación backend
      ================================================
      kpis: RevenueKpi[]
        - title: string — nombre del indicador
        - value: string — valor formateado (corto: $4.2M)
        - subtitle: string — valor detallado + conteo
        - trend: number — % de cambio vs período anterior (negativo = baja)
        - trendLabel: string — ej. "vs mes anterior"
        - description: string — frase explicativa corta

      funnel: FunnelStep[]
        - label: string — nombre de etapa
        - count: number — personas en esa etapa
        - dropPercent: number | null — % de caída vs etapa anterior
        - isWorst?: boolean — paso con peor conversión

      services: ServiceDemand[]
        - name: string — nombre del servicio
        - price: number — precio COP
        - inquiries: number — veces que preguntaron
        - bookings: number — veces que agendaron
        - closeRate: number — tasa de cierre %

      heatmap: HeatmapSlot[]
        - day: string — Lun, Mar, Mié, Jue, Vie, Sáb, Dom
        - hour: string — franja "9-11", "11-13", etc.
        - count: number — mensajes en esa celda
        - intensity: 0-4 — nivel precalculado (0=mínimo, 4=máximo)

      roi: BotRoi
        - resolvedPercent: number — % resueltas sin humana
        - resolvedCount: number — conteo absoluto
        - hoursSaved: number — horas estimadas (avg 4min/respuesta × respuestas)
        - afterHoursMessages: number — mensajes fuera del horario 9:00-22:30
        - estimatedValue: number — valor estimado en COP de horas ahorradas

      recent: RecentActivity[]
        - id: string
        - contact: string
        - avatar: string (iniciales)
        - channel: "whatsapp" | "instagram" | "facebook"
        - status: "scheduled" | "in_progress" | "pending" | "escalated" | "lost"
        - summary: string
        - time: string (ISO timestamp)
    `,
  }
}
