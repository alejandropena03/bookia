"use client"

import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/time"
import type { RecentActivity } from "@/lib/dashboard-mock"

const CANAL_STYLES: Record<string, string> = {
  whatsapp: "bg-green-50 text-green-700",
  instagram: "bg-pink-50 text-pink-700",
  facebook: "bg-blue-50 text-blue-700",
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-indigo-50 text-indigo-700",
  pending: "bg-amber-50 text-amber-700",
  escalated: "bg-red-50 text-red-700",
  lost: "bg-gray-50 text-gray-500",
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  in_progress: "En curso",
  pending: "Pendiente",
  escalated: "Escalada",
  lost: "Perdida",
}

export default function DashboardRecentActivity({ items }: { items: RecentActivity[] }) {
  return (
    <div className="app-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold app-text-hi">Actividad reciente</h3>
          <p className="text-xs app-text-lo mt-0.5">Últimas conversaciones en tiempo real</p>
        </div>
        <Link
          href="/conversations"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline"
        >
          Ver todas
        </Link>
      </div>

      <div className="divide-y app-border">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/conversations/${item.id}`}
            className="flex items-center gap-3 py-3 px-1 rounded-lg transition-colors hover:bg-indigo-50/30 -mx-1"
          >
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-semibold">{item.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium app-text-hi">{item.contact}</span>
                <Badge className={`text-[10px] py-0 px-1.5 border-0 leading-none ${CANAL_STYLES[item.channel]}`}>{item.channel}</Badge>
              </div>
              <p className="text-xs app-text-mid truncate">{item.summary}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge className={`text-[10px] py-0 px-1.5 border-0 leading-none font-medium ${STATUS_STYLES[item.status]}`}>
                {STATUS_LABELS[item.status]}
              </Badge>
              <span className="text-[10px] app-text-lo">{formatRelativeTime(item.time)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
