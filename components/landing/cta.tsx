"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

export default function Cta() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctaEls = contentRef.current?.querySelectorAll(".cta-line")

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

      if (!prefersReduced) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          },
        })

        if (ctaEls) {
          tl.fromTo(
            ctaEls,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.15, duration: 0.7, ease: "power3.out" }
          )
        }
      } else {
        if (ctaEls) gsap.set(ctaEls, { opacity: 1, y: 0 })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-28 px-4 bg-[#0A0A0F] overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#6D28D9]/10 blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#2563EB/5%,transparent_60%)]" />
      </div>

      <div ref={contentRef} className="relative z-10 max-w-2xl mx-auto text-center">
        <span className="cta-line inline-block px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/30 text-[11px] tracking-widest uppercase mb-6">
          ¿Listo para transformar tu negocio?
        </span>

        <h2 className="cta-line text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-[-0.03em] mb-6">
          Agenda una demo
          <br />
          <span className="gradient-brand">y descubre el cambio</span>
        </h2>

        <p className="cta-line text-white/40 text-lg mb-10 max-w-lg mx-auto">
          En 30 minutos te mostramos cómo Bookia puede automatizar tus conversaciones y agendar más citas.
        </p>

        <div className="cta-line flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#6D28D9] to-[#2563EB] hover:from-[#7C3AED] hover:to-[#3B82F6] text-white px-10 h-13 text-base rounded-xl shadow-2xl shadow-[#6D28D9]/30 animate-pulse-glow"
            >
              Quiero una demo <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <a href="mailto:hola@bookia.co">
            <Button
              size="lg"
              variant="outline"
              className="px-8 h-13 text-base rounded-xl border-white/[0.12] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white transition-all duration-300"
            >
              Escríbenos
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}
