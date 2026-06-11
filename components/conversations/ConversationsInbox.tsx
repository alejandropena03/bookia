"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronRight, Sparkles, User, Bot } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatRelativeTime } from "@/lib/time"
import { Button } from "@/components/ui/button"

const CANAL_STYLES: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-700",
  instagram: "bg-pink-100 text-pink-700",
  facebook: "bg-blue-100 text-blue-700",
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  pending: "bg-amber-100 text-amber-700",
  escalated: "bg-red-100 text-red-700",
  lost: "bg-gray-100 text-gray-500",
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  in_progress: "En curso",
  pending: "Pendiente",
  escalated: "Escalada",
  lost: "Perdida",
}

interface Message {
  id: string
  role: string
  content: string
  timestamp: string
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
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = conversations.filter((c) => {
    const matchSearch = c.contact_name.toLowerCase().includes(search.toLowerCase())
    const matchCanal = canalFilter === "all" || c.canal === canalFilter
    const matchStatus = statusFilter === "all" || c.estado === statusFilter
    return matchSearch && matchCanal && matchStatus
  })

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 -m-6 overflow-hidden">
      {/* Left panel — list */}
      <div className={`w-80 shrink-0 bg-white border-r border-gray-100 flex flex-col ${activeConversation ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-gray-100">
          <h1 className="font-bold text-[#0F172A] text-lg mb-3">Conversaciones</h1>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
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
              <TabsTrigger value="facebook" className="flex-1 text-xs">FB</TabsTrigger>
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
                className={`flex items-start gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${isActive ? "bg-indigo-50" : ""}`}
              >
                <Avatar className="w-9 h-9 shrink-0 mt-0.5">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">{conv.contact_avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-[#0F172A] truncate">{conv.contact_name}</span>
                    <span className="text-xs text-[#94A3B8] shrink-0 ml-2">{formatRelativeTime(conv.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge className={`text-[10px] py-0 px-1 border-0 ${CANAL_STYLES[conv.canal]}`}>{conv.canal}</Badge>
                    <Badge className={`text-[10px] py-0 px-1 border-0 ${STATUS_STYLES[conv.estado]}`}>{STATUS_LABELS[conv.estado]}</Badge>
                  </div>
                  <p className="text-xs text-[#64748B] truncate">{last?.content?.slice(0, 50)}...</p>
                </div>
              </Link>
            )
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-[#94A3B8]">Sin conversaciones</div>
          )}
        </div>
      </div>

      {/* Center — thread */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
          {/* Thread header */}
          <div className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-3">
            <Link href="/conversations" className="md:hidden text-[#64748B]">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">{activeConversation.contact_avatar}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#0F172A] text-sm">{activeConversation.contact_name}</span>
                <Badge className={`text-xs py-0 px-1.5 border-0 ${CANAL_STYLES[activeConversation.canal]}`}>{activeConversation.canal}</Badge>
              </div>
              <span className={`text-xs ${STATUS_STYLES[activeConversation.estado]?.replace("bg-", "text-").replace("-100", "-600")}`}>{STATUS_LABELS[activeConversation.estado]}</span>
            </div>
          </div>

          {/* Messages */}
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
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-[10px]">{activeConversation.contact_avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                          <p className="text-sm text-[#0F172A]">{msg.content}</p>
                        </div>
                        <p className="text-[10px] text-[#94A3B8] mt-1 ml-1">{formatRelativeTime(msg.timestamp)}</p>
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
                      <div className={`rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm ${isAI ? "bg-indigo-50 border border-indigo-100" : "bg-gradient-to-br from-purple-600 to-indigo-600"}`}>
                        <p className={`text-sm ${isAI ? "text-indigo-800" : "text-white"}`}>{msg.content}</p>
                      </div>
                      <p className="text-[10px] text-[#94A3B8] mt-1 text-right">{formatRelativeTime(msg.timestamp)}</p>
                      {isAI && (
                        <div className="flex gap-2 mt-2 justify-end">
                          <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">Aprobar</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs">Editar</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50">Escalar</Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-100 p-4">
            <div className="flex gap-2">
              <Input placeholder="Escribe un mensaje..." className="flex-1 h-10" disabled />
              <Button className="h-10 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm" disabled>
                Enviar
              </Button>
            </div>
            <p className="text-xs text-[#94A3B8] mt-2">Demo — el envío real se activa en Fase 2</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center text-center bg-[#F8FAFC]">
          <div>
            <div className="text-5xl mb-4">💬</div>
            <p className="text-[#64748B] font-medium">Selecciona una conversación</p>
            <p className="text-sm text-[#94A3B8] mt-1">para ver el hilo completo</p>
          </div>
        </div>
      )}

      {/* Right panel — contact info */}
      {activeConversation && (
        <div className="hidden lg:flex w-64 shrink-0 bg-white border-l border-gray-100 flex-col p-5 gap-5 overflow-y-auto">
          <div className="text-center">
            <Avatar className="w-14 h-14 mx-auto mb-3">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-bold">{activeConversation.contact_avatar}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-[#0F172A] text-sm">{activeConversation.contact_name}</p>
            <Badge className={`mt-1 text-xs border-0 ${CANAL_STYLES[activeConversation.canal]}`}>{activeConversation.canal}</Badge>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-[#94A3B8] uppercase font-medium mb-1">Estado</p>
              <Badge className={`text-xs border-0 ${STATUS_STYLES[activeConversation.estado]}`}>{STATUS_LABELS[activeConversation.estado]}</Badge>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] uppercase font-medium mb-1">Servicio</p>
              <p className="text-sm text-[#0F172A]">{activeConversation.servicio}</p>
            </div>
            {activeConversation.cita && (
              <div>
                <p className="text-xs text-[#94A3B8] uppercase font-medium mb-1">Cita agendada</p>
                <p className="text-sm text-emerald-600 font-medium">{activeConversation.cita.fecha}</p>
                <p className="text-sm text-[#64748B]">{activeConversation.cita.hora} — {activeConversation.cita.servicio}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-[#94A3B8] uppercase font-medium mb-1">Mensajes</p>
              <p className="text-sm text-[#0F172A]">{activeConversation.messages.length} en esta conversación</p>
            </div>
          </div>

          <Button variant="outline" className="w-full text-sm text-[#64748B]" disabled>
            Ver en Agenda Pro
          </Button>
        </div>
      )}
    </div>
  )
}
