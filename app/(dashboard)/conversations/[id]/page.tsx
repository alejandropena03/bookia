"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { listConversations, getConversation } from "@/lib/api"
import ConversationsInbox from "@/components/conversations/ConversationsInbox"
import { notFound } from "next/navigation"

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

function toDetailConv(detail: { conversation: { id: string; contact_name: string; channel: string; status: string; last_message_at: string | null }; messages: { id: string; direction: string; sender_type: string; text: string | null; created_at: string }[] }) {
  const c = detail.conversation
  const initials = (c.contact_name ?? "??").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase()
  const statusMap: Record<string, string> = { bot_active: "in_progress", human_active: "in_progress", escalated: "escalated", closed: "lost" }
  return {
    id: c.id,
    contact_name: c.contact_name,
    contact_avatar: initials,
    canal: c.channel,
    estado: statusMap[c.status] ?? "pending",
    servicio: "—",
    updated_at: c.last_message_at ?? new Date().toISOString(),
    cita: null,
    messages: detail.messages.map((m) => ({
      id: m.id,
      role: m.direction === "inbound" ? "user" : m.sender_type === "bot" ? "ai_suggestion" : "agent",
      content: m.text ?? "",
      timestamp: m.created_at,
    })),
  }
}

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: listData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(),
  })

  const { data: detailData, isLoading } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => getConversation(id),
  })

  if (!isLoading && !detailData) notFound()

  const conversations = listData?.data.map(toMockConv) ?? []
  const active = detailData ? toDetailConv(detailData) : undefined

  return <ConversationsInbox conversations={conversations} activeConversation={active} />
}
