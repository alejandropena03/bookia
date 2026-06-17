"use client"

import { useQuery } from "@tanstack/react-query"
import { getIntelligence } from "@/lib/api"
import { getDashboardData } from "@/lib/dashboard-mock"
import type { DashboardData } from "@/lib/dashboard-mock"
import RevenueKpiCards from "@/components/dashboard/RevenueKpiCards"
import ConversionFunnel from "@/components/dashboard/ConversionFunnel"
import ServiceDemand from "@/components/dashboard/ServiceDemandHeatmap"
import DemandHeatmap from "@/components/dashboard/DemandHeatmap"
import BotRoiCard from "@/components/dashboard/BotRoiCard"
import DashboardRecentActivity from "@/components/dashboard/DashboardRecentActivity"

export default function DashboardPage() {
  const { data: realData, isLoading, error } = useQuery({
    queryKey: ["intelligence"],
    queryFn: getIntelligence,
    refetchInterval: 30_000,
  })

  const data: DashboardData = (realData ?? getDashboardData()) as DashboardData
  const isUsingMock = !realData && !!error

  if (!data || !data.kpis || data.kpis.length === 0 || data.kpis.every(k => k.value === "$0" || k.value === "0")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] app-card p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h2 className="text-lg font-semibold app-text-hi mb-2">No hay suficientes datos aún</h2>
        <p className="app-text-mid text-sm max-w-md">
          Una vez que el agente comience a conversar con clientes, aquí verás métricas de ingresos potenciales,
          citas agendadas, embudo de conversión y más.
        </p>
        {isUsingMock && (
          <p className="text-xs app-text-lo mt-4">
            Mostrando datos de demostración porque el backend no está disponible.
          </p>
        )}
      </div>
    )
  }

  if (realData && error) {
    console.warn("Dashboard: backend respondió pero con error, usando mock:", error)
  }
  if (!realData && !isLoading && error) {
    console.warn("Dashboard: backend no disponible, usando mock fallback:", error)
  }

  const convRate = data.funnel[0].count > 0
    ? ((data.funnel[data.funnel.length - 1].count / data.funnel[0].count) * 100).toFixed(1)
    : "0.0"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold app-text-hi">Dashboard de inteligencia</h1>
          <p className="app-text-mid text-sm mt-1">Estética Santa María · Resumen de los últimos 30 días</p>
        </div>
        {isLoading && (
          <span className="text-xs app-text-lo flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Actualizando...
          </span>
        )}
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
                <span className="text-sm font-bold app-text-hi tabular-nums">{convRate}%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b app-border">
                <span className="text-xs app-text-mid">Servicio más demandado</span>
                <span className="text-sm font-bold app-text-hi">{data.services[0]?.name ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b app-border">
                <span className="text-xs app-text-mid">Mejor tasa de cierre</span>
                <span className="text-sm font-bold app-text-hi">{data.services[1]?.name ?? "—"}</span>
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
