"use client"

import { useQuery } from "@tanstack/react-query"
import { listConversations } from "@/lib/api"
import ConversationsInbox from "@/components/conversations/ConversationsInbox"

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
  const { data } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(),
    refetchInterval: 15_000,
  })

  const conversations = data?.data.map(toMockConv) ?? []

  return <ConversationsInbox conversations={conversations} />
}
