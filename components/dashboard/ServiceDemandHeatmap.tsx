"use client"

import { useState } from "react"
import type { ServiceDemand } from "@/lib/dashboard-mock"

function formatCOP(value: number): string {
  return `$${value.toLocaleString("es-CO")}`
}

export default function ServiceDemand({ services }: { services: ServiceDemand[] }) {
  const [sortBy, setSortBy] = useState<"inquiries" | "closeRate">("inquiries")
  const sorted = [...services].sort((a, b) => b[sortBy] - a[sortBy])
  const maxInquiries = Math.max(...services.map((s) => s.inquiries))

  return (
    <div className="app-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold app-text-hi">Demanda por servicio</h3>
          <p className="text-xs app-text-lo mt-0.5">Lo que más preguntan vs lo que más agendan</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setSortBy("inquiries")}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${sortBy === "inquiries" ? "bg-white app-text-hi shadow-sm" : "app-text-mid hover:text-app-text-hi"}`}
          >
            Demanda
          </button>
          <button
            onClick={() => setSortBy("closeRate")}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${sortBy === "closeRate" ? "bg-white app-text-hi shadow-sm" : "app-text-mid hover:text-app-text-hi"}`}
          >
            Cierre
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((svc, i) => {
          const barWidth = (svc.inquiries / maxInquiries) * 100
          const lowClose = svc.closeRate < 15
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm app-text-hi font-medium">{svc.name}</span>
                <span className="text-xs app-text-lo">{formatCOP(svc.price)}</span>
              </div>
              <div className="relative h-7">
                <div className="absolute inset-0 bg-gray-100 rounded-full" />
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500/30 to-indigo-500/50 rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
                <div className="absolute inset-y-0 left-0 flex items-center justify-between px-3 w-full">
                  <span className="text-xs font-medium app-text-hi">
                    {svc.inquiries} preguntas
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-600 font-semibold">{svc.bookings} agendadas</span>
                    <span className={`text-xs font-bold ${lowClose ? "text-amber-600" : "text-emerald-600"}`}>
                      {svc.closeRate.toFixed(1)}%
                    </span>
                    {lowClose && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 px-1 py-0.5 rounded font-medium">Oportunidad</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs app-text-lo mt-4">
        Servicios con alta demanda pero baja tasa de cierre son oportunidades de mejora en precios o presentación.
      </p>
    </div>
  )
}
