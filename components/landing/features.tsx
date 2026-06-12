"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MessageCircle, Globe, Calendar, BarChart3, ShieldCheck, Bell } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

const FEATURES = [
  {
    icon: MessageCircle,
    title: "WhatsApp + Messenger",
    desc: "Conecta tus canales de mensajería favoritos. Bookia centraliza todas las conversaciones en un solo inbox inteligente.",
  },
  {
    icon: Calendar,
    title: "Agenda conectada",
    desc: "Las citas se sincronizan con tu calendario en tiempo real, sin doble digitación ni cruces de horarios.",
  },
  {
    icon: BarChart3,
    title: "Inteligencia comercial",
    desc: "Bookia aprende de cada interacción. Identifica clientes frecuentes, servicios más solicitados y horas pico.",
  },
  {
    icon: ShieldCheck,
    title: "Pausa humana",
    desc: "Tú decides cuándo la IA responde sola y cuándo un humano toma el control. Total flexibilidad operativa.",
  },
  {
    icon: Bell,
    title: "Recordatorios automáticos",
    desc: "Reduce los no-shows con recordatorios automáticos por WhatsApp 24h y 2h antes de cada cita.",
  },
  {
    icon: Globe,
    title: "Instagram & Facebook",
    desc: "Tus clientes te escriben donde sea. Bookia responde con la misma calidad e inteligencia en todos los canales.",
  },
]

export default function Features() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cardEls = cardsRef.current?.querySelectorAll(".feature-card")

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

      if (!prefersReduced) {
        if (cardEls) {
          gsap.fromTo(
            cardEls,
            { y: 50, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.1,
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 65%",
              },
            }
          )
        }
      } else {
        if (cardEls) gsap.set(cardEls, { opacity: 1, y: 0 })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="caracteristicas"
      ref={sectionRef}
      className="relative py-32 px-6 sm:px-10 bg-[#0A0A0F] overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#7C3AED]/30 to-transparent" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 -left-20 w-[500px] h-[500px] rounded-full bg-[#6D28D9]/8 blur-[150px]" />
        <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] rounded-full bg-[#2563EB]/8 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-lo text-[11px] tracking-widest uppercase mb-5">
            Características
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-hi tracking-[-0.03em] mb-4">
            Todo lo que necesitas
          </h2>
          <p className="text-mid text-lg max-w-xl mx-auto">
            Cada funcionalidad diseñada para que dejes de perder ventas por no responder a tiempo.
          </p>
        </div>

        <div ref={cardsRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                onMouseMove={(e) => {
                  const el = e.currentTarget
                  const r = el.getBoundingClientRect()
                  el.style.setProperty("--mx", `${e.clientX - r.left}px`)
                  el.style.setProperty("--my", `${e.clientY - r.top}px`)
                }}
                className="feature-card group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] transition-all duration-500 cursor-default overflow-hidden hover:border-white/[0.14]"
              >
                {/* Spotlight que sigue el cursor */}
                <div
                  className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      "radial-gradient(420px circle at var(--mx) var(--my), rgba(124,58,237,0.12), transparent 65%)",
                  }}
                />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7C3AED]/25 to-[#2563EB]/25 ring-1 ring-white/10 flex items-center justify-center mb-4 group-hover:from-[#7C3AED]/40 group-hover:to-[#2563EB]/40 transition-all duration-500">
                    <Icon className="w-5 h-5 text-white/70 group-hover:text-white transition-all duration-500" />
                  </div>
                  <h3 className="text-base font-semibold text-hi mb-2">{feature.title}</h3>
                  <p className="text-mid text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
