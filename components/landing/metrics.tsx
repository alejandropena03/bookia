"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Timer, Users, Zap, CheckCircle2 } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

const METRICS = [
  { icon: Timer, value: "<5s", num: 5, label: "Tiempo de respuesta promedio", suffix: "s" },
  { icon: Users, value: "68%", num: 68, label: "Tasa de conversión a cita", suffix: "%" },
  { icon: Zap, value: "24/7", num: 100, label: "Disponibilidad continua", suffix: "" },
  { icon: CheckCircle2, value: "100%", num: 100, label: "Conversaciones atendidas", suffix: "%" },
]

function AnimatedMetric({
  metric,
  prefersReduced,
}: {
  metric: (typeof METRICS)[number]
  prefersReduced: boolean
}) {
  const valueRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = valueRef.current
    if (!el || prefersReduced) return

    if (metric.value.includes("<")) {
      el.textContent = metric.value
      return
    }

    const ctx = gsap.context(() => {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: metric.num,
        duration: 1.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 85%",
        },
        onUpdate: () => {
          el.textContent = `${Math.round(obj.val)}${metric.suffix}`
        },
      })
    }, el)

    return () => ctx.revert()
  }, [metric.num, metric.suffix, metric.value, prefersReduced])

  return (
    <div ref={cardRef} className="metric-card text-center p-6">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED]/15 to-[#2563EB]/15 ring-1 ring-white/[0.04] flex items-center justify-center mx-auto mb-4">
        <metric.icon className="w-6 h-6 text-white/60" />
      </div>
      <div ref={valueRef} className="text-3xl sm:text-4xl font-bold gradient-brand tabular-nums mb-2">
        {metric.value}
      </div>
      <div className="text-lo text-xs sm:text-sm leading-relaxed">{metric.label}</div>
    </div>
  )
}

export default function Metrics() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const countersRef = useRef<HTMLDivElement>(null)

  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false

  useEffect(() => {
    const counterEls = countersRef.current?.querySelectorAll(".metric-card")

    const ctx = gsap.context(() => {
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
  }, [prefersReduced])

  return (
    <section
      ref={sectionRef}
      className="relative py-28 px-6 sm:px-10 bg-gradient-to-b from-[#0A0A0F] to-[#0D0B14] overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/30 to-transparent" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#6D28D9]/8 to-[#2563EB]/8 blur-[180px]" />
      </div>

      <div ref={countersRef} className="relative z-10 max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
        {METRICS.map((metric) => (
          <AnimatedMetric key={metric.label} metric={metric} prefersReduced={prefersReduced} />
        ))}
      </div>
    </section>
  )
}
