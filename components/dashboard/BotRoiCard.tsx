"use client"

import type { BotRoi } from "@/lib/dashboard-mock"

function formatCOP(value: number): string {
  return `$${value.toLocaleString("es-CO")}`
}

export default function BotRoiCard({ roi }: { roi: BotRoi }) {
  const metrics = [
    {
      label: "Conversaciones resueltas sin humana",
      value: `${roi.resolvedPercent}%`,
      detail: `${roi.resolvedCount.toLocaleString("es-CO")} conversaciones`,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Horas de trabajo ahorradas",
      value: `${roi.hoursSaved}h`,
      detail: `~${Math.round(roi.hoursSaved / 4)} días hábiles`,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Mensajes fuera de horario respondidos",
      value: roi.afterHoursMessages.toLocaleString("es-CO"),
      detail: "Leads que se habrían perdido sin Bookia",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ]

  return (
    <div className="app-card p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold app-text-hi">ROI del bot</h3>
        <p className="text-xs app-text-lo mt-0.5">Lo que Bookia está haciendo por Santa María</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className={`${m.bg} rounded-xl p-4`}>
            <p className="text-xs app-text-mid font-medium mb-2">{m.label}</p>
            <p className={`text-3xl font-extrabold tabular-nums ${m.color}`}>{m.value}</p>
            <p className="text-xs app-text-mid mt-1">{m.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold app-text-hi">Valor estimado del bot este mes</p>
          <p className="text-xs app-text-mid mt-0.5">Costo de oportunidad de horas ahorradas + leads recuperados</p>
        </div>
        <p className="text-2xl font-extrabold tabular-nums gradient-brand">{formatCOP(roi.estimatedValue)}</p>
      </div>
    </div>
  )
}
