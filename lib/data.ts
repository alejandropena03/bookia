import { readFileSync } from "fs"
import path from "path"
export { formatRelativeTime } from "./time"

export function getMetrics() {
  return JSON.parse(readFileSync(path.join(process.cwd(), "data", "metrics.json"), "utf-8"))
}

export function getConversations() {
  return JSON.parse(readFileSync(path.join(process.cwd(), "data", "conversations.json"), "utf-8"))
}

export function getConversationById(id: string) {
  const convs = getConversations()
  return convs.find((c: { id: string }) => c.id === id) ?? null
}
