interface MetricCardProps {
  title: string
  value: string | number
  delta: string
  deltaPositive: boolean
  icon: string
}

export default function MetricCard({ title, value, delta, deltaPositive, icon }: MetricCardProps) {
  return (
    <div className="app-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm app-text-mid font-medium">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold app-text-hi mb-2">{value}</div>
      <div className={`text-xs font-medium ${deltaPositive ? "text-emerald-600" : "text-amber-600"}`}>
        {delta}
      </div>
    </div>
  )
}
