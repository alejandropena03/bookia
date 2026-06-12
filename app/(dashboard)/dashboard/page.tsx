import { getDashboardData } from "@/lib/dashboard-mock"
import RevenueKpiCards from "@/components/dashboard/RevenueKpiCards"
import ConversionFunnel from "@/components/dashboard/ConversionFunnel"
import ServiceDemand from "@/components/dashboard/ServiceDemandHeatmap"
import DemandHeatmap from "@/components/dashboard/DemandHeatmap"
import BotRoiCard from "@/components/dashboard/BotRoiCard"
import DashboardRecentActivity from "@/components/dashboard/DashboardRecentActivity"

export default function DashboardPage() {
  const data = getDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold app-text-hi">Dashboard de inteligencia</h1>
        <p className="app-text-mid text-sm mt-1">Estética Santa María · Resumen de los últimos 30 días</p>
      </div>

      <RevenueKpiCards kpis={data.kpis} />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ConversionFunnel funnel={data.funnel} />
        </div>
        <div className="lg:col-span-2">
          <div className="app-card p-6">
            <h3 className="text-sm font-semibold app-text-hi mb-3">Resumen rápido</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b app-border">
                <span className="text-xs app-text-mid">Tasa de conversión general</span>
                <span className="text-sm font-bold app-text-hi tabular-nums">
                  {((data.funnel[data.funnel.length - 1].count / data.funnel[0].count) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b app-border">
                <span className="text-xs app-text-mid">Servicio más demandado</span>
                <span className="text-sm font-bold app-text-hi">{data.services[0].name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b app-border">
                <span className="text-xs app-text-mid">Mejor tasa de cierre</span>
                <span className="text-sm font-bold app-text-hi">{data.services[1].name}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs app-text-mid">Pico de demanda semanal</span>
                <span className="text-sm font-bold app-text-hi">Jueves 5-7pm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ServiceDemand services={data.services} />

      <div className="grid lg:grid-cols-2 gap-6">
        <DemandHeatmap data={data.heatmap} />
        <BotRoiCard roi={data.roi} />
      </div>

      <DashboardRecentActivity items={data.recent} />
    </div>
  )
}
