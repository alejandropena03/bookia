import { getConversations, getConversationById } from "@/lib/data"
import ConversationsInbox from "@/components/conversations/ConversationsInbox"
import { notFound } from "next/navigation"

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  const conversations = getConversations()
  const active = getConversationById(params.id)
  if (!active) notFound()
  return <ConversationsInbox conversations={conversations} activeConversation={active} />
}
