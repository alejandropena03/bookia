"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["#6D28D9", "#2563EB", "#A78BFA", "#C4B5FD"]
const LABELS: Record<string, string> = {
  agendada: "Agendada",
  en_curso: "En curso",
  pendiente: "Pendiente",
  perdida: "Perdida",
}

export default function StatusDonut({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([key, value]) => ({ name: LABELS[key] ?? key, value }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E8E8EF", fontSize: "12px" }} />
        <text x="50%" y="48%" textAnchor="middle" fontSize={12} fill="#52525B" fontWeight={500}>
          Total
        </text>
        <text x="50%" y="58%" textAnchor="middle" fontSize={16} fill="#18181B" fontWeight={700}>
          {chartData.reduce((s, d) => s + d.value, 0)}
        </text>
      </PieChart>
    </ResponsiveContainer>
  )
}
