"use client"

import { useState } from "react"
import type { FunnelStep } from "@/lib/dashboard-mock"

const MAX_WIDTH = 100

function ProgressBar({ pct, isWorst }: { pct: number; isWorst?: boolean }) {
  return (
    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${isWorst ? "bg-red-400" : "bg-gradient-to-r from-indigo-500 to-blue-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function ConversionFunnel({ funnel }: { funnel: FunnelStep[] }) {
  const [expanded, setExpanded] = useState(false)
  const maxCount = funnel[0].count

  return (
    <div className="app-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold app-text-hi">Embudo de conversión</h3>
          <p className="text-xs app-text-lo mt-0.5">De mensaje a pago — ¿dónde se pierden los leads?</p>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-xs app-text-mid hover:text-app-text-hi underline underline-offset-2">
          {expanded ? "Resumir" : "Ver detalle"}
        </button>
      </div>

      <div className="space-y-4">
        {funnel.map((step, i) => {
          const pct = (step.count / maxCount) * MAX_WIDTH
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-sm app-text-hi font-medium">{step.label}</span>
                  {step.isWorst && (
                    <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">Mayor fuga</span>
                  )}
                </div>
                <span className="text-sm font-bold tabular-nums app-text-hi">{step.count.toLocaleString("es-CO")}</span>
              </div>
              <ProgressBar pct={pct} isWorst={step.isWorst} />
              {step.dropPercent !== null && (
                <p className={`text-xs mt-1 ${step.isWorst ? "text-red-500 font-medium" : "app-text-lo"}`}>
                  {step.dropPercent}% dejaron de avanzar aquí
                </p>
              )}
              {expanded && (
                <p className="text-xs app-text-lo mt-1 ml-4 leading-relaxed">
                  {i === 0 && "Todos los mensajes entrantes al negocio"}
                  {i === 1 && "Respondieron, hicieron una pregunta o pidieron información"}
                  {i === 2 && "El mayor filtro — preguntaron por precio/tarifas"}
                  {i === 3 && "Llegaron hasta agendar una cita"}
                  {i === 4 && "Confirmaron con pago o depósito"}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
