"use client"

import { Fragment } from "react"
import type { HeatmapSlot } from "@/lib/dashboard-mock"

const INTENSITY_CLASSES = [
  "bg-indigo-50 text-indigo-300",
  "bg-indigo-100 text-indigo-400",
  "bg-indigo-200 text-indigo-500",
  "bg-indigo-300 text-white",
  "bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold",
]

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const HOURS = ["9-11", "11-13", "13-15", "15-17", "17-19", "19-21", "21-22:30"]

function heatKey(day: string, hour: string) {
  return `${day}|${hour}`
}

export default function DemandHeatmap({ data }: { data: HeatmapSlot[] }) {
  const map = new Map(data.map((s) => [heatKey(s.day, s.hour), s]))

  return (
    <div className="app-card p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold app-text-hi">Mapa de calor de demanda</h3>
        <p className="text-xs app-text-lo mt-0.5">¿Cuándo llegan más mensajes? Picos en tarde-noche</p>
      </div>

      <div className="overflow-x-auto">
        <div className="grid gap-1" style={{ gridTemplateColumns: `48px repeat(${HOURS.length}, 1fr)` }}>
          <div />
          {HOURS.map((h) => (
            <div key={h} className="text-[10px] app-text-lo text-center pb-1.5 font-medium">{h}</div>
          ))}
          {DAYS.map((day) => (
            <Fragment key={day}>
              <div className="text-[10px] app-text-lo font-medium self-center">{day}</div>
              {HOURS.map((hour) => {
                const slot = map.get(heatKey(day, hour))
                const count = slot?.count ?? 0
                const intensity = slot?.intensity ?? 0
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`rounded-md h-8 flex items-center justify-center text-[10px] tabular-nums transition-all duration-150 hover:scale-105 hover:shadow-sm cursor-default ${INTENSITY_CLASSES[intensity]}`}
                    title={`${day} ${hour}: ${count} mensajes`}
                  >
                    {count > 0 ? count : ""}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <span className="text-[10px] app-text-lo">Menos</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-4 h-4 rounded ${INTENSITY_CLASSES[i]} flex items-center justify-center`}>
            <span className="text-[8px]">{i + 1}</span>
          </div>
        ))}
        <span className="text-[10px] app-text-lo">Más</span>
      </div>
    </div>
  )
}
