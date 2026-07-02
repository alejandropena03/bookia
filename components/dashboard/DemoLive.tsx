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

// Arranques de conversación reales: le dan al que ve la demo algo que tocar en
// lugar de una caja de texto vacía, y muestran los caminos fuertes del agente
// (precio multi-mercado, agendamiento, seguridad clínica).
const STARTERS = [
  "¿Cuánto cuesta el Russian Lips?",
  "Quiero agendar una valoración",
  "¿Duele el botox?",
]

export default function DemoLive() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "welcome", text: "¡Buenas! Soy Carlos, de Santa María 😊 Escríbeme como si fueras un cliente y verás cómo respondo en tiempo real.", sender: "bot" },
  ])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const [demoConvId, setDemoConvId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollDown = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setConnected(false)
  }, [])

  useEffect(() => {
    scrollDown()
  }, [messages, scrollDown])

  // SSE: solo se usa para confirmar "Conectado" y, una vez conocido demoConvId,
  // re-emitir mensajes OUTBOUND de esa misma conversación (cross-talk protegido).
  useEffect(() => {
    if (!open) return
    // Nota: no reseteamos `connected` aquí de forma síncrona (dispara render en
    // cascada). El estado arranca en false y el callback de SSE lo pone en true;
    // al cerrar el panel, handleClose lo vuelve a false.
    const unsub = subscribeToSSE(
      (data) => {
        setConnected(true)
        const msg = data?.message
        if (!msg) return
        const dir = msg.direction ?? data?.direction
        const convId = msg.conversationId ?? data?.conversationId
        // Filtra cross-talk: solo outbound + mismo conversationId (una vez conocido).
        if (dir !== "outbound") return
        if (demoConvId && convId && convId !== demoConvId) return
        const text = msg.text ?? ""
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

  async function handleSend(preset?: string) {
    const text = (preset ?? input).trim()
    if (!text || sending) return
    setInput("")
    setSending(true)
    setMessages((prev) => [...prev, { id: `user-${++msgId}`, text, sender: "user" }])
    try {
      const result = await sendSimMessage(text)
      setDemoConvId(result.conversationId)
      // Respuesta primaria del agente: usa el agentResponse del POST (determinista).
      const agentText = result.agentResponse?.text
      if (agentText) {
        setMessages((prev) => [...prev, { id: `bot-${++msgId}`, text: agentText, sender: "bot" }])
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err ?? "Error desconocido")
      setMessages((prev) => [...prev, { id: `bot-${++msgId}`, text: `⚠️ ${reason}`, sender: "bot" }])
    }
    setSending(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full gradient-brand-bg text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.03] pl-3 pr-4 h-14 ${open ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        aria-label="Abrir demo en vivo con el agente"
        aria-expanded={open}
      >
        <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/15">
          <Bot className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 presence-dot ring-2 ring-[#5B21B6]" />
        </span>
        <span className="text-sm font-semibold pr-0.5">Probar el agente</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-end justify-center sm:justify-end p-4 sm:p-6 pointer-events-none">
          <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={handleClose} aria-hidden="true" />
          <div
            className="relative w-full sm:w-96 h-[520px] sm:h-[560px] app-surface rounded-2xl shadow-2xl border app-border flex flex-col overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
            role="dialog"
            aria-label="Demo en vivo — agente IA Bookia"
            aria-modal="true"
          >
            <div className="gradient-brand-bg px-4 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/15 shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 presence-dot ring-2 ring-[#5B21B6]" />
                </span>
                <div className="leading-tight">
                  <p className="font-display text-base text-white">Carlos</p>
                  <p className="text-[11px] text-white/75 flex items-center gap-1.5">
                    {connected ? "Asistente de Santa María" : "Conectando…"}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors -mr-1" aria-label="Cerrar demo en vivo">
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
                  <div className="app-surface border app-border rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[11px] app-text-lo">Carlos está escribiendo</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Arranques de conversación — solo mientras el hilo está "en blanco". */}
            {messages.length === 1 && !sending && (
              <div className="px-3 pb-1 pt-0.5 flex flex-wrap gap-1.5 shrink-0">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-xs app-text-mid app-warm-bg hover:app-text-hi rounded-full px-3 py-1.5 border border-transparent hover:border-[#EFE6DA] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

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
                Respuestas reales del agente — el mismo que atiende a tus clientes
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}