"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface DayData {
  date: string
  mensajes: number
  citas: number
}

export default function ConversionChart({ data }: { data: DayData[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} interval={4} />
        <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Line type="monotone" dataKey="mensajes" stroke="#4F46E5" strokeWidth={2} dot={false} name="Mensajes" />
        <Line type="monotone" dataKey="citas" stroke="#7C3AED" strokeWidth={2} dot={false} name="Citas" />
      </LineChart>
    </ResponsiveContainer>
  )
}
