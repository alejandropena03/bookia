"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

interface Message {
  sender: "bot" | "client"
  text: string
}

type ChatItem =
  | { type: "bubble"; msg: Message }
  | { type: "typing" }

const CHAT_ITEMS: ChatItem[] = [
  { type: "bubble", msg: { sender: "client", text: "Hola, ¿a qué hora tienen disponible para un depilado láser? 🪒" } },
  { type: "typing" },
  { type: "bubble", msg: { sender: "bot", text: "¡Hola! 🙌 Dame un segundo y reviso la agenda." } },
  { type: "bubble", msg: { sender: "bot", text: "Tenemos disponible:" } },
  { type: "bubble", msg: { sender: "bot", text: "📅 Martes 14 — 10:00 AM · 11:30 AM · 4:00 PM\n📅 Jueves 16 — 9:00 AM · 2:00 PM · 5:30 PM" } },
  { type: "bubble", msg: { sender: "client", text: "Perfecto, el martes a las 11:30" } },
  { type: "typing" },
  { type: "bubble", msg: { sender: "bot", text: "✅ ¡Listo! Confirmada tu cita de depilado láser el martes 14 a las 11:30 AM con Mariana." } },
  { type: "bubble", msg: { sender: "bot", text: "Te enviaré un recordatorio 24h antes. ¿Algo más en que pueda ayudarte? ✨" } },
]

function BotAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center shrink-0 shadow-lg shadow-[#6D28D9]/20">
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
    <div className={`flex gap-2.5 items-end ${isBot ? "" : "flex-row-reverse"}`}>
      {isBot ? <BotAvatar /> : <ClientAvatar />}
      <div
        className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
          isBot
            ? "bg-white/[0.06] text-mid rounded-2xl rounded-bl-md border border-white/[0.06]"
            : "bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-white rounded-2xl rounded-br-md shadow-lg shadow-[#6D28D9]/15"
        }`}
      >
        {msg.text}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-2.5 items-end">
      <BotAvatar />
      <div className="px-4 py-3 bg-white/[0.06] rounded-2xl rounded-bl-md border border-white/[0.06] flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-white/40 dot-1" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/40 dot-2" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/40 dot-3" />
      </div>
    </div>
  )
}

export default function DemoChat() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

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
        const items = section.querySelectorAll<HTMLElement>(".chat-item")
        gsap.set(items, { opacity: 0, y: 20 })

        ScrollTrigger.create({
          trigger: section,
          start: "top 40%",
          end: "bottom 20%",
          onEnter: () => {
            const tl = gsap.timeline()

            items.forEach((item) => {
              const isTyping = item.dataset.type === "typing"
              if (isTyping) {
                tl.to(item, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" })
                  .to({}, { duration: 0.7 })
                  .to(item, { opacity: 0, y: 10, duration: 0.2 })
              } else {
                tl.to(item, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, "+=0.1")
              }
            })
          },
          once: true,
        })
      } else {
        gsap.set(section.querySelectorAll<HTMLElement>(".chat-item"), { opacity: 1, y: 0 })
      }

      gsap.to(".dot-1", { opacity: 0.2, duration: 0.6, repeat: -1, yoyo: true, ease: "power1.inOut" })
      gsap.to(".dot-2", { opacity: 0.2, duration: 0.6, repeat: -1, yoyo: true, ease: "power1.inOut", delay: 0.2 })
      gsap.to(".dot-3", { opacity: 0.2, duration: 0.6, repeat: -1, yoyo: true, ease: "power1.inOut", delay: 0.4 })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-28 px-4 bg-gradient-to-b from-[#08070C] to-[#0D0B14] overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/30 to-transparent" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#6D28D9]/5 blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div ref={headingRef} className="text-center mb-16">
          <span className="demo-line inline-block px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-lo text-[11px] tracking-widest uppercase mb-5">
            Demo en vivo
          </span>
          <h2 className="demo-line text-3xl sm:text-4xl md:text-5xl font-bold text-hi tracking-[-0.03em] mb-4">
            Míralo responder solo
          </h2>
          <p className="demo-line text-mid text-lg max-w-xl mx-auto">
            Un cliente pregunta por un servicio y Bookia gestiona toda la conversación hasta dejar la cita confirmada.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-[#0D0B14]/80 backdrop-blur-xl rounded-3xl border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/40">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2563EB]" />
                <span className="text-mid text-xs font-medium">Bookia AI · Clínica Santa María</span>
              </div>
              <div className="ml-auto text-white/20 text-xs">●●●</div>
            </div>
            <div className="px-4 py-4 space-y-3.5">
              {CHAT_ITEMS.map((item, i) => {
                if (item.type === "typing") {
                  return (
                    <div key={i} className="chat-item" data-type="typing">
                      <TypingDots />
                    </div>
                  )
                }
                return (
                  <div key={i} className="chat-item" data-type="bubble">
                    <ChatBubble msg={item.msg} />
                  </div>
                )
              })}
            </div>
            <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-2">
              <div className="flex-1 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06]" />
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center">
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
