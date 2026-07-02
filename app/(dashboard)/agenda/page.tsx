"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { listBookings, type Booking } from "@/lib/api"
import { Calendar, Loader2, AlertCircle, ChevronRight, CheckCircle2, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  cancelled: "bg-gray-100 text-gray-500",
}
const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente de abono",
  cancelled: "Cancelada",
}

// El datetime del booking puede venir ISO (parseado por chrono) o como texto libre
// si no se pudo parsear con confianza. Mostramos algo legible en ambos casos.
function formatWhen(datetime: string | null): string {
  if (!datetime) return "Fecha por confirmar"
  const d = new Date(datetime)
  if (!isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(datetime)) {
    return d.toLocaleString("es-CO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
  }
  return datetime
}

function formatPrice(price: string | null): string | null {
  if (!price) return null
  const n = parseFloat(price)
  if (isNaN(n)) return price
  return `$${n.toLocaleString("es-CO")}`
}

function SummaryCard({ label, value, accent, icon: Icon }: { label: string; value: number; accent: string; icon: typeof Calendar }) {
  return (
    <div className="app-card p-5 relative overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} aria-hidden="true" />
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl app-warm-bg flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 app-warm" />
        </div>
        <div>
          <div className="font-display text-2xl leading-none app-text-hi tabular-nums">{value}</div>
          <p className="text-xs app-text-lo mt-1">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function AgendaPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => listBookings(),
    refetchInterval: 20_000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-sm app-text-mid">Cargando agenda…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="font-medium app-text-hi mb-1">No pudimos cargar la agenda</p>
          <p className="text-sm app-text-mid">{(error as Error).message ?? "Verifica que el backend esté corriendo"}</p>
        </div>
      </div>
    )
  }

  const bookings: Booking[] = data?.data ?? []
  const summary = data?.summary ?? { total: 0, confirmed: 0, pending: 0 }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] app-brand font-semibold uppercase tracking-[0.14em] mb-1">Estética Santa María</p>
        <h1 className="font-display text-[2rem] leading-none app-text-hi tracking-tight">Agenda</h1>
        <p className="app-text-mid text-sm mt-2">Citas que tu agente ha registrado a partir de las conversaciones</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Citas en total" value={summary.total} accent="linear-gradient(90deg,#6D28D9,#2563EB)" icon={Calendar} />
        <SummaryCard label="Confirmadas" value={summary.confirmed} accent="linear-gradient(90deg,#059669,#34D399)" icon={CheckCircle2} />
        <SummaryCard label="Pendientes de abono" value={summary.pending} accent="linear-gradient(90deg,#D97706,#F59E0B)" icon={Clock} />
      </div>

      {bookings.length === 0 ? (
        <div className="app-card p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl app-warm-bg flex items-center justify-center">
            <Calendar className="w-7 h-7 app-warm" />
          </div>
          <h2 className="font-display text-lg app-text-hi mb-1.5">Aún no hay citas agendadas</h2>
          <p className="app-text-mid text-sm max-w-md mx-auto">
            Cuando el agente cierre una cita en una conversación, aparecerá aquí con su estado de pago.
          </p>
        </div>
      ) : (
        <div className="app-card overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1.4fr_1.6fr_1fr_auto] gap-4 px-5 py-3 border-b app-border text-[11px] app-text-lo uppercase tracking-wide font-semibold">
            <span>Paciente</span>
            <span>Servicio y fecha</span>
            <span>Estado</span>
            <span className="sr-only">Abrir</span>
          </div>
          <ul>
            {bookings.map((b) => {
              const price = formatPrice(b.service_price)
              return (
                <li key={b.id}>
                  <Link
                    href={`/conversations/${b.conversation_id}`}
                    className="grid sm:grid-cols-[1.4fr_1.6fr_1fr_auto] gap-1 sm:gap-4 items-center px-5 py-4 border-b app-border last:border-0 hover:bg-[#FBF9FF] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium app-text-hi truncate">{b.contact_name ?? "Sin nombre"}</p>
                      {b.city && <p className="text-xs app-text-lo">{b.city}</p>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm app-text-hi truncate">
                        {b.service_name}{price && <span className="app-text-lo"> · {price}</span>}
                      </p>
                      <p className="text-xs app-text-mid capitalize">{formatWhen(b.datetime)}</p>
                    </div>
                    <div>
                      <Badge className={`text-xs border-0 ${STATUS_STYLES[b.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 app-text-lo justify-self-end hidden sm:block" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <p className="text-xs app-text-lo flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 presence-dot" />
        La sincronización con Agenda Pro llegará en Fase 2 — por ahora estas son las citas que el agente registró.
      </p>
    </div>
  )
}
