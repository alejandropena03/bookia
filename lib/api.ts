import { getTenantSlug } from "./tenant"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-tenant-slug": getTenantSlug(),
      ...opts?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

export interface DashboardData {
  kpis: { title: string; value: string; subtitle: string; trend: number; trendLabel: string; description: string }[]
  funnel: { label: string; count: number; dropPercent: number | null; isWorst?: boolean }[]
  services: { name: string; price: number; inquiries: number; bookings: number; closeRate: number }[]
  heatmap: { day: string; hour: string; count: number; intensity: 0 | 1 | 2 | 3 | 4 }[]
  roi: { resolvedPercent: number; resolvedCount: number; hoursSaved: number; afterHoursMessages: number; estimatedValue: number }
  recent: { id: string; contact: string; avatar: string; channel: "whatsapp" | "instagram" | "facebook"; status: string; summary: string; time: string }[]
}

export function getIntelligence(): Promise<DashboardData> {
  return apiFetch<DashboardData>("/api/metrics/intelligence")
}

export interface ConversationRow {
  id: string
  status: string
  created_at: string
  last_message_at: string | null
  contact_name: string
  contact_phone: string | null
  channel: string
  last_message: string | null
}

export interface ConversationsResponse {
  data: ConversationRow[]
  page: number
  limit: number
  total: number
}

export function listConversations(params?: { status?: string; channel?: string; page?: number }): Promise<ConversationsResponse> {
  const qs = new URLSearchParams()
  if (params?.status) qs.set("status", params.status)
  if (params?.channel) qs.set("channel", params.channel)
  if (params?.page) qs.set("page", String(params.page))
  const q = qs.toString()
  return apiFetch<ConversationsResponse>(`/api/conversations${q ? `?${q}` : ""}`)
}

export interface ConversationDetail {
  conversation: {
    id: string
    status: string
    created_at: string
    last_message_at: string | null
    assigned_user_id: string | null
    contact_id: string
    contact_name: string
    contact_phone: string | null
    channel: string
  }
  messages: {
    id: string
    direction: string
    sender_type: string
    text: string | null
    created_at: string
  }[]
}

export function getConversation(id: string): Promise<ConversationDetail> {
  return apiFetch<ConversationDetail>(`/api/conversations/${id}`)
}

export function replyConversation(id: string, text: string): Promise<{ messageId: string }> {
  return apiFetch<{ messageId: string }>(`/api/conversations/${id}/reply`, {
    method: "POST",
    body: JSON.stringify({ text }),
  })
}

export function takeoverConversation(id: string): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/api/conversations/${id}/takeover`, { method: "POST" })
}

export function handbackConversation(id: string): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/api/conversations/${id}/handback`, { method: "POST" })
}

export interface CatalogItem {
  id: string
  name: string
  description: string | null
  price: string
  currency: string
  category: string | null
  duration_minutes: number | null
  is_active: number
}

export function getCatalog(): Promise<{ data: CatalogItem[] }> {
  return apiFetch<{ data: CatalogItem[] }>("/api/catalog")
}

export interface BusinessProfile {
  persona: string
  rules: Record<string, unknown>
  hours: Record<string, string>
  booking_mode: string
  system_prompt_overrides: string | null
}

export function getProfile(): Promise<BusinessProfile> {
  return apiFetch<BusinessProfile>("/api/profile")
}

export function updateProfile(data: Partial<BusinessProfile>): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export function sendSimMessage(text: string): Promise<{ messageId: string; conversationId: string; agentResponse?: unknown }> {
  const slug = getTenantSlug()
  return apiFetch<{ messageId: string; conversationId: string; agentResponse?: unknown }>("/api/sim/message", {
    method: "POST",
    body: JSON.stringify({ text, tenantSlug: slug, from: "demo-user", name: "Tú (demo)", channel: "mock" }),
  })
}

export function subscribeToSSE(onMessage: (data: unknown) => void, onError?: (err: Event) => void): () => void {
  const es = new EventSource(`${API_BASE}/api/sim/stream?tenantSlug=${getTenantSlug()}`)
  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data)
      onMessage(parsed)
    } catch {
      onMessage(event.data)
    }
  }
  es.onerror = (err) => {
    onError?.(err)
  }
  return () => es.close()
}
