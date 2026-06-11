import { getConversations } from "@/lib/data"
import ConversationsInbox from "@/components/conversations/ConversationsInbox"

export default function ConversationsPage() {
  const conversations = getConversations()
  return <ConversationsInbox conversations={conversations} />
}
