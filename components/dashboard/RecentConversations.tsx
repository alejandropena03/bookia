import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/time"

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

interface Conversation {
  id: string
  contact_name: string
  contact_avatar: string
  canal: string
  estado: string
  servicio: string
  updated_at: string
  messages: { content: string }[]
}

export default function RecentConversations({ conversations }: { conversations: Conversation[] }) {
  return (
    <div className="space-y-1">
      {conversations.map((conv) => {
        const lastMsg = conv.messages[conv.messages.length - 1]
        return (
          <Link key={conv.id} href={`/conversations/${conv.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50/40 transition-colors group">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-semibold">{conv.contact_avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium app-text-hi">{conv.contact_name}</span>
                <Badge className={`text-xs py-0 px-1.5 border-0 ${CANAL_STYLES[conv.canal] ?? "bg-gray-100 text-gray-600"}`}>{conv.canal}</Badge>
              </div>
              <p className="text-xs app-text-mid truncate">{lastMsg?.content?.slice(0, 60)}...</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge className={`text-xs py-0 px-1.5 border-0 ${STATUS_STYLES[conv.estado] ?? "bg-gray-100"}`}>{STATUS_LABELS[conv.estado] ?? conv.estado}</Badge>
              <span className="text-xs app-text-lo">{formatRelativeTime(conv.updated_at)}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
