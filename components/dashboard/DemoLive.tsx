"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { sendSimMessage, subscribeToSSE } from "@/lib/api"
import { formatMessageText } from "@/lib/format-message"
import { Bot, X, Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ChatMsg {
  id: string
  text: string
  sender: "user" | "bot"
}

let msgId = 0

export default function DemoLive() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "welcome", text: "¡Hola! Soy el agente IA de Bookia. Escribe un mensaje como si fueras un cliente y verás cómo respondo en vivo.", sender: "bot" },
  ])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const [demoConvId, setDemoConvId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollDown = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }, [])

  useEffect(() => {
    scrollDown()
  }, [messages, scrollDown])

  // SSE: solo se usa para confirmar "Conectado" y, una vez conocido demoConvId,
  // re-emitir mensajes OUTBOUND de esa misma conversación (cross-talk protegido).
  useEffect(() => {
    if (!open) return
    setConnected(false)
    const unsub = subscribeToSSE(
      (data: any) => {
        setConnected(true)
        const msg = data?.message
        if (!msg) return
        const dir = msg.direction ?? data?.direction
        const convId = data?.message?.conversationId ?? data?.conversationId
        // Filtra cross-talk: solo outbound + mismo conversationId (una vez conocido).
        if (dir !== "outbound") return
        if (demoConvId && convId && convId !== demoConvId) return
        const text = msg?.text ?? ""
        if (!text) return
        setMessages((prev) => {
          if (prev.some((m) => m.id === `sse-${msg.id}`)) return prev
          return [...prev, { id: `sse-${msg.id}`, text, sender: "bot" }]
        })
      },
      () => setConnected(false)
    )
    return unsub
  }, [open, demoConvId])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setInput("")
    setSending(true)
    setMessages((prev) => [...prev, { id: `user-${++msgId}`, text, sender: "user" }])
    try {
      const result = await sendSimMessage(text)
      setDemoConvId(result.conversationId)
      // Respuesta primaria del agente: usa el agentResponse del POST (determinista).
      const agentText = (result as any).agentResponse?.text
      if (agentText) {
        setMessages((prev) => [...prev, { id: `bot-${++msgId}`, text: agentText, sender: "bot" }])
      }
    } catch (err: any) {
      const reason = err?.message ?? String(err ?? "Error desconocido")
      setMessages((prev) => [...prev, { id: `bot-${++msgId}`, text: `⚠️ ${reason}`, sender: "bot" }])
    }
    setSending(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-brand-bg text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center"
        aria-label="Abrir demo en vivo"
        aria-expanded={open}
      >
        <Bot className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-end justify-center sm:justify-end p-4 sm:p-6 pointer-events-none">
          <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="relative w-full sm:w-96 h-[520px] sm:h-[560px] app-surface rounded-2xl shadow-2xl border app-border flex flex-col overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
            role="dialog"
            aria-label="Demo en vivo — agente IA Bookia"
            aria-modal="true"
          >
            <div className="gradient-brand-bg px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-white/20 text-white text-xs font-bold">B</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-white">Demo en vivo</p>
                  <p className="text-[10px] text-white/70 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-300" : "bg-yellow-300 animate-pulse"}`} />
                    {connected ? "Conectado" : "Conectando..."}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors" aria-label="Cerrar demo en vivo">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-indigo-50/20 to-transparent" aria-live="polite" aria-label="Mensajes del agente">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.sender === "bot" ? (
                    <div className="flex items-end gap-2 max-w-[85%]">
                      <Avatar className="w-6 h-6 shrink-0 mb-0.5">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                          <Bot className="w-3.5 h-3.5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="app-surface border app-border rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                          <p className="text-sm app-text-hi">{formatMessageText(msg.text)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[85%]">
                      <div className="app-brand-bg rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
                        <p className="text-sm text-white">{msg.text}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex items-end gap-2 max-w-[85%]">
                  <Avatar className="w-6 h-6 shrink-0 mb-0.5">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                      <Bot className="w-3.5 h-3.5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="app-surface border app-border rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="app-surface border-t app-border p-3 shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend() }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe como cliente..."
                  className="flex-1 h-10 text-sm"
                  disabled={sending}
                  aria-label="Escribe un mensaje como cliente del bot"
                />
                <Button type="submit" size="icon" className="h-10 w-10 app-brand-bg text-white shrink-0" disabled={sending || !input.trim()} aria-label="Enviar mensaje">
                  {sending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
              <p className="text-[10px] app-text-lo mt-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Los mensajes se envían al backend real y el agente responde por SSE
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}