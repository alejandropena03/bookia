"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MessageCircle, Database, Sparkles } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  {
    icon: MessageCircle,
    number: "01",
    title: "Conecta tus canales",
    desc: "Vincula WhatsApp Business, Instagram y Facebook en minutos. Un solo inbox centraliza todos tus mensajes.",
  },
  {
    icon: Database,
    number: "02",
    title: "Carga tu negocio",
    desc: "Bookia aprende tus servicios, precios, horarios y disponibilidad. Sin programación, solo configuración simple.",
  },
  {
    icon: Sparkles,
    number: "03",
    title: "Responde solo",
    desc: "Tu cliente pregunta y Bookia responde al instante, agenda citas y envía recordatorios. Tú solo supervisas.",
  },
]

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const headingEls = headingRef.current?.querySelectorAll(".how-line")
    const stepEls = stepsRef.current?.querySelectorAll(".step-card")

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

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
              trigger: sectionRef.current,
              start: "top 75%",
            },
          }
        )
      }

      if (!prefersReduced) {
        if (stepEls) {
          gsap.fromTo(
            stepEls,
            { y: 60, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.2,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: {
                trigger: stepsRef.current,
                start: "top 70%",
              },
            }
          )
        }
      } else {
        if (stepEls) gsap.set(stepEls, { opacity: 1, y: 0 })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="como-funciona"
      ref={sectionRef}
      className="relative py-28 px-4 bg-gradient-to-b from-[#0F0C18] to-[#0A0A0F] overflow-hidden"
    >
      {/* Divisor luminoso superior — separa secciones con un hilo de luz (premium) */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#7C3AED]/40 to-transparent" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-[#2563EB]/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#6D28D9]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div ref={headingRef} className="text-center mb-20">
          <span className="how-line inline-block px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/30 text-[11px] tracking-widest uppercase mb-5">
            Cómo funciona
          </span>
          <h2 className="how-line text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-[-0.03em] mb-4">
            Tres pasos. Sin fricción.
          </h2>
          <p className="how-line text-white/40 text-lg max-w-xl mx-auto">
            De la conexión a la primera cita agendada en minutos, no en días.
          </p>
        </div>

        <div ref={stepsRef} className="grid md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div
                key={step.number}
                className="step-card group relative"
              >
                <div className="h-full p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl font-bold text-white/10 tracking-tight">{step.number}</span>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6D28D9]/20 to-[#2563EB]/20 flex items-center justify-center group-hover:from-[#6D28D9]/30 group-hover:to-[#2563EB]/30 transition-all duration-500">
                      <Icon className="w-5 h-5 text-white/60 group-hover:text-white/80 transition-all duration-500" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
