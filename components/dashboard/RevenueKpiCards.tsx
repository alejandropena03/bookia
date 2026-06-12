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

const INTENSITY_GRADIENT = ["from-indigo-50 to-indigo-100", "from-indigo-100 to-purple-100"]

export default function RevenueKpiCards({ kpis }: { kpis: RevenueKpi[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className={`app-card p-6 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${idx === 0 ? "md:col-span-1 md:row-span-1" : ""}`}
        >
          {idx === 0 && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-transparent pointer-events-none" />
          )}
          <div className="relative">
            <p className="text-xs app-text-mid font-medium tracking-wide uppercase mb-3">{kpi.title}</p>
            <div className="tabular-nums text-4xl font-extrabold app-text-hi tracking-tight mb-1">
              <AnimatedNumber value={kpi.value} />
            </div>
            <p className="text-sm font-medium app-text-lo mb-3">{kpi.subtitle}</p>
            <div className="flex items-center gap-2">
              <TrendArrow trend={kpi.trend} />
              <span className="text-xs app-text-lo">{kpi.trendLabel}</span>
            </div>
            <p className="text-xs app-text-lo mt-2 leading-relaxed">{kpi.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
