"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Timer, Users, Zap, CheckCircle2 } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

interface MetricItem {
  icon: typeof Timer
  value: string
  label: string
}

const METRICS: MetricItem[] = [
  { icon: Timer, value: "<5s", label: "Tiempo de respuesta promedio" },
  { icon: Users, value: "68%", label: "Tasa de conversión a cita" },
  { icon: Zap, value: "24/7", label: "Disponibilidad continua" },
  { icon: CheckCircle2, value: "100%", label: "Conversaciones atendidas" },
]

export default function Metrics() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const countersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const counterEls = countersRef.current?.querySelectorAll(".metric-card")

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

      if (!prefersReduced) {
        if (counterEls) {
          gsap.fromTo(
            counterEls,
            { y: 40, opacity: 0, scale: 0.95 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              stagger: 0.1,
              duration: 0.6,
              ease: "power3.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
              },
            }
          )
        }
      } else {
        if (counterEls) gsap.set(counterEls, { opacity: 1, y: 0, scale: 1 })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-4 bg-gradient-to-b from-[#0A0A0F] to-[#0D0B14] overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#6D28D9]/8 to-[#2563EB]/8 blur-[180px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div ref={countersRef} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {METRICS.map((metric) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.label}
                className="metric-card text-center p-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6D28D9]/15 to-[#2563EB]/15 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-white/60" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold gradient-brand mb-2">
                  {metric.value}
                </div>
                <div className="text-white/30 text-xs sm:text-sm leading-relaxed">
                  {metric.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
