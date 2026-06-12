"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

interface Message {
  sender: "bot" | "client"
  text: string
  delay: number
}

const MESSAGES: Message[] = [
  { sender: "client", text: "Hola, ¿a qué hora tienen disponible para un depilado láser? 🪒", delay: 0 },
  { sender: "bot", text: "¡Hola! 🙌 Dame un segundo y reviso la agenda.", delay: 1.2 },
  { sender: "bot", text: "Tenemos disponible:", delay: 2.8 },
  { sender: "bot", text: "📅 Martes 14 — 10:00 AM · 11:30 AM · 4:00 PM\n📅 Jueves 16 — 9:00 AM · 2:00 PM · 5:30 PM", delay: 3.2 },
  { sender: "client", text: "Perfecto, el martes a las 11:30", delay: 4.8 },
  { sender: "bot", text: "✅ ¡Listo! Confirmada tu cita de depilado láser el martes 14 a las 11:30 AM con Mariana.", delay: 6.0 },
  { sender: "bot", text: "Te enviaré un recordatorio 24h antes. ¿Algo más en que pueda ayudarte? ✨", delay: 7.4 },
]

function BotAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6D28D9] to-[#2563EB] flex items-center justify-center shrink-0 shadow-lg shadow-[#6D28D9]/20">
      <span className="text-white text-[10px] font-bold">B</span>
    </div>
  )
}

function ClientAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
      <span className="text-white/60 text-[10px] font-bold">T</span>
    </div>
  )
}

function ChatBubble({ msg }: { msg: Message }) {
  const isBot = msg.sender === "bot"
  return (
    <div className={`flex gap-2.5 items-end message-bubble ${isBot ? "" : "flex-row-reverse"}`}>
      {isBot ? <BotAvatar /> : <ClientAvatar />}
      <div
        className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
          isBot
            ? "bg-white/[0.06] text-white/80 rounded-2xl rounded-bl-md border border-white/[0.06]"
            : "bg-gradient-to-br from-[#6D28D9] to-[#2563EB] text-white rounded-2xl rounded-br-md shadow-lg shadow-[#6D28D9]/15"
        }`}
      >
        {msg.text}
      </div>
    </div>
  )
}

export default function DemoChat() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const chat = chatRef.current
    if (!section || !chat) return

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const headingEls = headingRef.current?.querySelectorAll(".demo-line")

    const ctx = gsap.context(() => {
      if (headingEls) {
        gsap.fromTo(
          headingEls,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 70%",
            },
          }
        )
      }

      if (!prefersReduced) {
        const bubbles = chat.querySelectorAll(".message-bubble")
        gsap.set(bubbles, { opacity: 0, y: 20 })

        ScrollTrigger.create({
          trigger: section,
          start: "top 40%",
          end: "bottom 20%",
          onEnter: () => {
            const tl = gsap.timeline()
            tl.to(bubbles, {
              opacity: 1,
              y: 0,
              stagger: 0.35,
              duration: 0.5,
              ease: "power2.out",
            })
          },
          once: true,
        })
      } else {
        gsap.set(chat.querySelectorAll(".message-bubble"), { opacity: 1, y: 0 })
      }
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-28 px-4 bg-gradient-to-b from-[#0A0A0F] to-[#0D0B14] overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#6D28D9]/5 blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div ref={headingRef} className="text-center mb-16">
          <span className="demo-line inline-block px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/30 text-[11px] tracking-widest uppercase mb-5">
            Demo en vivo
          </span>
          <h2 className="demo-line text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-[-0.03em] mb-4">
            Míralo responder solo
          </h2>
          <p className="demo-line text-white/40 text-lg max-w-xl mx-auto">
            Una paciente pregunta por un servicio y Bookia gestiona toda la conversación hasta dejar la cita confirmada.
          </p>
        </div>

        <div ref={chatRef} className="max-w-md mx-auto">
          <div className="bg-[#0D0B14]/80 backdrop-blur-xl rounded-3xl border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/40">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#6D28D9] to-[#2563EB]" />
                <span className="text-white/60 text-xs font-medium">Bookia AI · Clínica Santa María</span>
              </div>
              <div className="ml-auto text-white/20 text-xs">●●●</div>
            </div>
            <div className="px-4 py-4 space-y-3.5">
              {MESSAGES.map((msg, i) => (
                <ChatBubble key={i} msg={msg} />
              ))}
            </div>
            <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-2">
              <div className="flex-1 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06]" />
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6D28D9] to-[#2563EB] flex items-center justify-center">
                <svg className="w-4 h-4 text-white rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
