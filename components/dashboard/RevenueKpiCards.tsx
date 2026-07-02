"use client"

import { useEffect, useState } from "react"
import type { RevenueKpi } from "@/lib/dashboard-mock"

function TrendArrow({ trend }: { trend: number }) {
  const up = trend >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-600" : "text-red-500"}`}>
      <svg className={`w-3 h-3 ${up ? "" : "rotate-180"}`} viewBox="0 0 12 12" fill="none">
        <path d="M6 1.5L10.5 7.5H1.5L6 1.5Z" fill="currentColor" />
      </svg>
      {Math.abs(trend)}%
    </span>
  )
}

function AnimatedNumber({ value, suffix }: { value: string; suffix?: string }) {
  const [display, setDisplay] = useState("0")
  const target = parseInt(value.replace(/[^0-9.]/g, ""))
  const prefix = value.startsWith("$") ? "$" : ""

  useEffect(() => {
    if (isNaN(target)) { setDisplay(value); return }
    let start = 0
    const duration = 800
    const step = Math.ceil(target / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(`${prefix}${start.toLocaleString("es-CO")}`)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, value, prefix])

  return <span>{display}{suffix}</span>
}

// Barra de acento por métrica: la primera (ingreso) es cálida (arena), las demás
// llevan el gradiente de marca. La barra hairline sustituye al velo morado plano.
const ACCENT_BARS = [
  "linear-gradient(90deg, #D97706, #F59E0B)",
  "linear-gradient(90deg, #6D28D9, #2563EB)",
  "linear-gradient(90deg, #6D28D9, #2563EB)",
]

export default function RevenueKpiCards({ kpis }: { kpis: RevenueKpi[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {kpis.map((kpi, idx) => {
        const isRevenue = idx === 0
        return (
          <div
            key={idx}
            className={`${isRevenue ? "app-card-warm" : "app-card"} p-6 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
          >
            {/* Hairline de acento superior — encoding: cálido = dinero, marca = actividad */}
            <span
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: ACCENT_BARS[idx] ?? ACCENT_BARS[1] }}
              aria-hidden="true"
            />
            <div className="relative">
              <p className="text-[11px] app-text-lo font-semibold tracking-[0.12em] uppercase mb-4">{kpi.title}</p>
              <div className={`font-display tabular-nums text-[2.6rem] leading-none tracking-tight mb-1.5 ${isRevenue ? "app-warm" : "app-text-hi"}`}>
                <AnimatedNumber value={kpi.value} />
              </div>
              <p className="text-sm font-medium app-text-mid mb-3">{kpi.subtitle}</p>
              <div className="flex items-center gap-2">
                <TrendArrow trend={kpi.trend} />
                <span className="text-xs app-text-lo">{kpi.trendLabel}</span>
              </div>
              <p className="text-xs app-text-lo mt-2 leading-relaxed">{kpi.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
