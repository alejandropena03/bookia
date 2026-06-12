import { getMetrics, getConversations, formatRelativeTime } from "@/lib/data"
import MetricCard from "@/components/dashboard/MetricCard"
import ConversionChart from "@/components/dashboard/ConversionChart"
import ChannelBreakdown from "@/components/dashboard/ChannelBreakdown"
import StatusDonut from "@/components/dashboard/StatusDonut"
import RecentConversations from "@/components/dashboard/RecentConversations"

export default function DashboardPage() {
  const metrics = getMetrics()
  const conversations = getConversations()
  const recent = conversations.slice(0, 8)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold app-text-hi">Dashboard</h1>
        <p className="app-text-mid text-sm mt-1">Hoy, 10 de junio de 2026</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Mensajes hoy"
          value={metrics.summary.mensajes_hoy}
          delta={`+${metrics.summary.mensajes_hoy_delta}% vs ayer`}
          deltaPositive
          icon="💬"
        />
        <MetricCard
          title="Citas agendadas"
          value={metrics.summary.citas_esta_semana}
          delta={`+${metrics.summary.citas_semana_delta}% esta semana`}
          deltaPositive
          icon="📅"
        />
        <MetricCard
          title="Tasa conversión"
          value={`${metrics.summary.tasa_conversion}%`}
          delta="Meta: 70%"
          deltaPositive={metrics.summary.tasa_conversion >= 70}
          icon="📊"
        />
        <MetricCard
          title="Tiempo respuesta"
          value={`${metrics.summary.tiempo_respuesta_min} min`}
          delta="Meta: < 5 min"
          deltaPositive
          icon="⚡"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 app-card p-6">
          <h2 className="font-semibold app-text-hi mb-4">Conversaciones vs Citas — últimos 30 días</h2>
          <ConversionChart data={metrics.daily} />
        </div>
        <div className="app-card p-6">
          <h2 className="font-semibold app-text-hi mb-4">Por canal</h2>
          <ChannelBreakdown channels={metrics.channels} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="app-card p-6">
          <h2 className="font-semibold app-text-hi mb-4">Estado conversaciones</h2>
          <StatusDonut data={metrics.conversation_status} />
        </div>
        <div className="lg:col-span-2 app-card p-6">
          <h2 className="font-semibold app-text-hi mb-4">Conversaciones recientes</h2>
          <RecentConversations conversations={recent} />
        </div>
      </div>
    </div>
  )
}
