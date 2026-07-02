"use client"

import { Bot, ArrowRightLeft, Zap } from "lucide-react"

interface Props {
  autonomyPercent: number
  handoffRate: number
  escalatedCount: number
  totalConversations: number
  avgResponseSeconds: number
}

// Franja de rendimiento del agente: métricas reales de autonomía y handoff leídas
// de la tabla conversations. Da credibilidad operativa ("qué tan solo se defiende
// el bot") sin depender de un almacén de métricas todavía inexistente.
export default function BotPerformanceStrip({
  autonomyPercent, handoffRate, escalatedCount, totalConversations, avgResponseSeconds,
}: Props) {
  const responseLabel = avgResponseSeconds < 60
    ? `${avgResponseSeconds}s`
    : `${Math.round(avgResponseSeconds / 60)}m`

  return (
    <div className="app-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg gradient-brand-bg flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-display text-lg app-text-hi">Rendimiento del agente</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Autonomía — barra de progreso, la métrica ancla */}
        <div className="sm:col-span-1">
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="font-display text-3xl app-text-hi tabular-nums">{autonomyPercent}%</span>
            <span className="text-xs app-text-lo">resueltas solo</span>
          </div>
          <div className="h-2 rounded-full bg-[#EDE9FE] overflow-hidden" role="img" aria-label={`${autonomyPercent}% de conversaciones resueltas por el bot`}>
            <div className="h-full rounded-full gradient-brand-bg transition-all duration-700" style={{ width: `${autonomyPercent}%` }} />
          </div>
          <p className="text-xs app-text-lo mt-2">
            {totalConversations} conversaciones · el bot resolvió {autonomyPercent}% sin intervención humana
          </p>
        </div>

        {/* Handoff */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl app-warm-bg flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-4 h-4 app-warm" />
          </div>
          <div>
            <div className="font-display text-2xl app-text-hi tabular-nums leading-none">{handoffRate}%</div>
            <p className="text-xs app-text-lo mt-1">Escaladas a humano</p>
            <p className="text-xs app-text-lo">{escalatedCount} conversaciones</p>
          </div>
        </div>

        {/* Tiempo de respuesta */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="font-display text-2xl app-text-hi tabular-nums leading-none">{responseLabel}</div>
            <p className="text-xs app-text-lo mt-1">Respuesta promedio</p>
            <p className="text-xs app-text-lo">al instante, 24/7</p>
          </div>
        </div>
      </div>
    </div>
  )
}
