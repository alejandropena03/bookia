"use client"

import { useQuery } from "@tanstack/react-query"
import { listConversations } from "@/lib/api"
import ConversationsInbox from "@/components/conversations/ConversationsInbox"
import { AlertCircle, Loader2 } from "lucide-react"

function toMockConv(row: { id: string; contact_name: string; channel: string; status: string; last_message: string | null; last_message_at: string | null }) {
  const initials = (row.contact_name ?? "??").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase()
  return {
    id: row.id,
    contact_name: row.contact_name,
    contact_avatar: initials,
    canal: row.channel,
    estado: row.status === "bot_active" ? "in_progress" : row.status,
    servicio: "—",
    updated_at: row.last_message_at ?? new Date().toISOString(),
    cita: null,
    messages: row.last_message
      ? [{ id: "last", role: "user", content: row.last_message, timestamp: row.last_message_at ?? new Date().toISOString() }]
      : [],
  }
}

export default function ConversationsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(),
    refetchInterval: 15_000,
    retry: 2,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-sm app-text-mid">Cargando conversaciones...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="font-medium app-text-hi mb-1">Error al cargar conversaciones</p>
          <p className="text-sm app-text-mid mb-4">{(error as Error).message ?? "Verifica que el backend esté corriendo (localhost:8787)"}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-indigo-600 hover:underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const conversations = data?.data?.map(toMockConv) ?? []

  return <ConversationsInbox conversations={conversations} />
}
