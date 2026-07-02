"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { listConversations, getConversation, API_BASE } from "@/lib/api"
import ConversationsInbox from "@/components/conversations/ConversationsInbox"
import { notFound } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"

function toMockConv(row: { id: string; contact_name: string; channel: string; status: string; last_message: string | null; last_message_at: string | null }) {
  const initials = (row.contact_name ?? "??").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase()
  return {
    id: row.id,
    contact_name: row.contact_name,
    contact_avatar: initials,
    canal: row.channel,
    estado: row.status,
    servicio: "—",
    updated_at: row.last_message_at ?? new Date().toISOString(),
    cita: null,
    messages: row.last_message
      ? [{ id: "last", role: "user", content: row.last_message, timestamp: row.last_message_at ?? new Date().toISOString() }]
      : [],
  }
}

function toDetailConv(detail: { conversation: { id: string; contact_name: string; channel: string; status: string; last_message_at: string | null }; messages: { id: string; direction: string; sender_type: string; text: string | null; mediaUrl: string | null; created_at: string }[] }) {
  const c = detail.conversation
  const initials = (c.contact_name ?? "??").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase()
  return {
    id: c.id,
    contact_name: c.contact_name,
    contact_avatar: initials,
    canal: c.channel,
    estado: c.status,
    servicio: "—",
    updated_at: c.last_message_at ?? new Date().toISOString(),
    cita: null,
    messages: detail.messages
      .filter((m) => m.text || m.mediaUrl)
      .map((m) => ({
        id: m.id,
        role: m.direction === "inbound" ? "user" : m.sender_type === "bot" ? "bot" : "agent",
        content: m.text ?? "",
        mediaUrl: m.mediaUrl ? `${API_BASE}${m.mediaUrl}` : undefined,
        timestamp: m.created_at,
      })),
  }
}

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(),
  })

  const { data: detailData, isLoading: detailLoading, error } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => getConversation(id),
    retry: 2,
    refetchInterval: 4000,
  })

  if (listLoading || detailLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-sm app-text-mid">Cargando conversación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="font-medium app-text-hi mb-1">Error al cargar la conversación</p>
          <p className="text-sm app-text-mid">{(error as Error).message}</p>
        </div>
      </div>
    )
  }

  if (!detailData) notFound()

  const conversations = listData?.data?.map(toMockConv) ?? []
  const active = toDetailConv(detailData)

  return <ConversationsInbox conversations={conversations} activeConversation={active} />
}
