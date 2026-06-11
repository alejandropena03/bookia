"use client"

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["#10B981", "#4F46E5", "#F59E0B", "#EF4444"]
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
        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }} />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
