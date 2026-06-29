"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronRight, Sparkles, Bot } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatRelativeTime } from "@/lib/time"
import { Button } from "@/components/ui/button"
import { replyConversation, takeoverConversation, handbackConversation } from "@/lib/api"

const CANAL_STYLES: Record<string, string> = {
  whatsapp: "bg-green-50 text-green-700",
  instagram: "bg-pink-50 text-pink-700",
  facebook: "bg-blue-50 text-blue-700",
  messenger: "bg-purple-50 text-purple-700",
  mock: "bg-gray-50 text-gray-600",
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-indigo-50 text-indigo-700",
  pending: "bg-amber-50 text-amber-700",
  escalated: "bg-red-50 text-red-700",
  lost: "bg-gray-50 text-gray-500",
  bot_active: "bg-indigo-50 text-indigo-700",
  human_active: "bg-emerald-50 text-emerald-700",
  closed: "bg-gray-50 text-gray-500",
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  in_progress: "En curso",
  pending: "Pendiente",
  escalated: "Escalada",
  lost: "Perdida",
  bot_active: "Bot activo",
  human_active: "Humano activo",
  closed: "Cerrada",
}

interface Message {
  id: string
  role: string
  content: string
  timestamp: string
  messageId?: string
}

interface Conversation {
  id: string
  contact_name: string
  contact_avatar: string
  canal: string
  estado: string
  servicio: string
  updated_at: string
  cita: { fecha: string; hora: string; servicio: string } | null
  messages: Message[]
}

interface Props {
  conversations: Conversation[]
  activeConversation?: Conversation
}

export default function ConversationsInbox({ conversations, activeConversation }: Props) {
  const [search, setSearch] = useState("")
  const [canalFilter, setCanalFilter] = useState("all")
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)
  const [sentMsg, setSentMsg] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const [handingBack, setHandingBack] = useState(false)
  const [escalatedIds, setEscalatedIds] = useState<Set<string>>(new Set())

  const getEstado = (conv: Conversation) => escalatedIds.has(conv.id) ? "human_active" : conv.estado

  const filtered = conversations.filter((c) => {
    const matchSearch = c.contact_name.toLowerCase().includes(search.toLowerCase())
    const matchCanal = canalFilter === "all" || c.canal === canalFilter
    return matchSearch && matchCanal
  })

  async function handleReply() {
    const text = replyText.trim()
    if (!text || !activeConversation || sending) return
    setSending(true)
    try {
      await replyConversation(activeConversation.id, text)
      setReplyText("")
      setSentMsg(true)
      setTimeout(() => setSentMsg(false), 2000)
    } catch {
      // fallback silently
    }
    setSending(false)
  }

  async function handleApprove(content: string) {
    if (!activeConversation || sending) return
    setSending(true)
    try {
      await replyConversation(activeConversation.id, content)
      setSentMsg(true)
      setTimeout(() => setSentMsg(false), 2000)
    } catch {
      // fallback silently
    }
    setSending(false)
  }

  async function handleEscalate() {
    if (!activeConversation || escalating) return
    setEscalating(true)
    try {
      await takeoverConversation(activeConversation.id)
      setEscalatedIds(prev => new Set(prev).add(activeConversation.id))
    } catch {
      // fallback silently
    }
    setEscalating(false)
  }

  async function handleHandback() {
    if (!activeConversation || handingBack) return
    setHandingBack(true)
    try {
      await handbackConversation(activeConversation.id)
      setEscalatedIds(prev => { const next = new Set(prev); next.delete(activeConversation.id); return next })
    } catch {
      // fallback silently
    }
    setHandingBack(false)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 -m-6 overflow-hidden">
      <div className={`w-80 shrink-0 app-surface border-r app-border flex flex-col ${activeConversation ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b app-border">
          <h1 className="font-bold app-text-hi text-lg mb-3">Conversaciones</h1>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 app-text-lo" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Tabs value={canalFilter} onValueChange={setCanalFilter}>
            <TabsList className="w-full h-8 text-xs">
              <TabsTrigger value="all" className="flex-1 text-xs">Todos</TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex-1 text-xs">WA</TabsTrigger>
              <TabsTrigger value="instagram" className="flex-1 text-xs">IG</TabsTrigger>
              <TabsTrigger value="messenger" className="flex-1 text-xs">FB</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => {
            const last = conv.messages[conv.messages.length - 1]
            const isActive = activeConversation?.id === conv.id
            return (
              <Link
                key={conv.id}
                href={`/conversations/${conv.id}`}
                className={`flex items-start gap-3 p-4 border-b app-border hover:bg-indigo-50/30 transition-colors ${isActive ? "bg-indigo-50" : ""}`}
              >
                <Avatar className="w-9 h-9 shrink-0 mt-0.5">
                  <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-semibold">{conv.contact_avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium app-text-hi truncate">{conv.contact_name}</span>
                    <span className="text-xs app-text-lo shrink-0 ml-2" aria-label={`Última actividad ${formatRelativeTime(conv.updated_at)}`}>{formatRelativeTime(conv.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge className={`text-[10px] py-0 px-1 border-0 ${CANAL_STYLES[conv.canal] ?? "bg-gray-50 text-gray-600"}`}>{conv.canal}</Badge>
                    <Badge className={`text-[10px] py-0 px-1 border-0 ${STATUS_STYLES[getEstado(conv)] ?? "bg-gray-50 text-gray-500"}`}>{STATUS_LABELS[getEstado(conv)] ?? getEstado(conv)}</Badge>
                  </div>
                  <p className="text-xs app-text-mid truncate">{last?.content?.slice(0, 50)}...</p>
                </div>
              </Link>
            )
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm app-text-lo" role="status">Sin conversaciones</div>
          )}
        </div>
      </div>

      {activeConversation ? (
        <div className="flex-1 flex flex-col min-w-0 app-bg">
          <div className="h-16 app-surface border-b app-border flex items-center px-4 gap-3">
            <Link href="/conversations" className="md:hidden app-text-mid rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]/40" aria-label="Volver a la lista de conversaciones">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-semibold">{activeConversation.contact_avatar}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold app-text-hi text-sm">{activeConversation.contact_name}</span>
                <Badge className={`text-xs py-0 px-1.5 border-0 ${CANAL_STYLES[activeConversation.canal] ?? "bg-gray-50 text-gray-600"}`}>{activeConversation.canal}</Badge>
              </div>
              <span className={`text-xs ${STATUS_STYLES[getEstado(activeConversation)]?.replace("bg-", "text-").replace("-50", "-600") ?? "text-gray-500"}`}>
                {getEstado(activeConversation) === "human_active" ? "Tú" : STATUS_LABELS[getEstado(activeConversation)] ?? getEstado(activeConversation)}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeConversation.messages.map((msg) => {
              const isUser = msg.role === "user"
              const isAI = msg.role === "ai_suggestion"
              const isAgent = msg.role === "agent"

              return (
                <div key={msg.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                  {isUser && (
                    <div className="flex items-end gap-2 max-w-[75%]">
                      <Avatar className="w-6 h-6 shrink-0 mb-0.5">
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-[10px]">{activeConversation.contact_avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="app-surface border app-border rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                          <p className="text-sm app-text-hi">{msg.content}</p>
                        </div>
                        <p className="text-[10px] app-text-lo mt-1 ml-1" aria-label={`Enviado ${formatRelativeTime(msg.timestamp)}`}>{formatRelativeTime(msg.timestamp)}</p>
                      </div>
                    </div>
                  )}
                  {(isAI || isAgent) && (
                    <div className="max-w-[75%]">
                      {isAI && (
                        <div className="flex items-center gap-1 mb-1 justify-end">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span className="text-[10px] text-indigo-400 font-medium">Sugerida por IA</span>
                        </div>
                      )}
                      <div className={`rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm ${isAI ? "bg-indigo-50 border border-indigo-100" : "app-brand-bg"}`}>
                        <p className={`text-sm ${isAI ? "app-text-hi" : "text-white"}`}>{msg.content}</p>
                      </div>
                      <p className="text-[10px] app-text-lo mt-1 text-right">{formatRelativeTime(msg.timestamp)}</p>
                      {isAI && (
                        <div className="flex gap-2 mt-2 justify-end">
<Button
                size="sm"
                className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => handleApprove(msg.content)}
                disabled={sending}
                aria-label="Aprobar respuesta sugerida por IA"
              >
                {sending ? "..." : "Aprobar"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setReplyText(msg.content)}
                aria-label="Editar respuesta sugerida por IA"
              >
                Editar
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={handleEscalate} disabled={escalating} aria-label="Escalar conversación a humano">
                {escalating ? "..." : "Escalar"}
              </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="app-surface border-t app-border p-4">
            {getEstado(activeConversation) === "human_active" && (
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs text-emerald-600 font-medium">Estás al frente de esta conversación</span>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleHandback} disabled={handingBack} aria-label="Devolver conversación al bot">
                  {handingBack ? "..." : "Devolver al bot"}
                </Button>
              </div>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); handleReply() }}
              className="flex gap-2"
            >
              <Input
                placeholder="Escribe un mensaje..."
                className="flex-1 h-10"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sending}
                aria-label="Escribe un mensaje como operador humano"
              />
              <Button
                type="submit"
                className="h-10 app-brand-bg text-white text-sm"
                disabled={sending || !replyText.trim()}
              >
                {sending ? "..." : sentMsg ? "✓" : "Enviar"}
              </Button>
            </form>
            <p className="text-xs app-text-lo mt-2">
              {sentMsg ? "✅ Mensaje enviado" : "Responde como operador humano a esta conversación"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center text-center app-bg">
          <div>
            <div className="text-5xl mb-4">💬</div>
            <p className="app-text-mid font-medium">Selecciona una conversación</p>
            <p className="text-sm app-text-lo mt-1">para ver el hilo completo</p>
          </div>
        </div>
      )}

      {activeConversation && (
        <div className="hidden lg:flex w-64 shrink-0 app-surface border-l app-border flex-col p-5 gap-5 overflow-y-auto">
          <div className="text-center">
            <Avatar className="w-14 h-14 mx-auto mb-3">
              <AvatarFallback className="bg-indigo-50 text-indigo-700 text-lg font-bold">{activeConversation.contact_avatar}</AvatarFallback>
            </Avatar>
            <p className="font-semibold app-text-hi text-sm">{activeConversation.contact_name}</p>
            <Badge className={`mt-1 text-xs border-0 ${CANAL_STYLES[activeConversation.canal] ?? "bg-gray-50 text-gray-600"}`}>{activeConversation.canal}</Badge>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs app-text-lo uppercase font-medium mb-1">Estado</p>
              <Badge className={`text-xs border-0 ${STATUS_STYLES[getEstado(activeConversation)] ?? "bg-gray-50 text-gray-500"}`}>{getEstado(activeConversation) === "human_active" ? "Tú al frente" : STATUS_LABELS[getEstado(activeConversation)] ?? getEstado(activeConversation)}</Badge>
            </div>
            <div>
              <p className="text-xs app-text-lo uppercase font-medium mb-1">Servicio</p>
              <p className="text-sm app-text-hi">{activeConversation.servicio}</p>
            </div>
            {activeConversation.cita && (
              <div>
                <p className="text-xs app-text-lo uppercase font-medium mb-1">Cita agendada</p>
                <p className="text-sm text-emerald-600 font-medium">{activeConversation.cita.fecha}</p>
                <p className="text-sm app-text-mid">{activeConversation.cita.hora} — {activeConversation.cita.servicio}</p>
              </div>
            )}
            <div>
              <p className="text-xs app-text-lo uppercase font-medium mb-1">Mensajes</p>
              <p className="text-sm app-text-hi">{activeConversation.messages.length} en esta conversación</p>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t app-border">
            <p className="text-xs app-text-lo text-center leading-relaxed">
              Agenda Pro<br />
              <span className="text-[11px]">Próximamente</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
