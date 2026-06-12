"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const textEls = textRef.current?.querySelectorAll(".hero-line")
    const ctaEls = ctaRef.current?.querySelectorAll(".hero-cta-item")

    const ctx = gsap.context(() => {
      if (!prefersReduced) {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

        if (textEls) {
          tl.fromTo(
            textEls,
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.15, duration: 0.9 }
          )
        }
        if (ctaEls) {
          tl.fromTo(
            ctaEls,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.12, duration: 0.7 },
            "-=0.3"
          )
        }
      } else {
        if (textEls) gsap.set(textEls, { opacity: 1, y: 0 })
        if (ctaEls) gsap.set(ctaEls, { opacity: 1, y: 0 })
      }

      gsap.to(".aurora-orb", {
        x: "random(-30, 30)",
        y: "random(-20, 20)",
        scale: "random(0.9, 1.1)",
        opacity: "random(0.15, 0.35)",
        duration: "random(6, 10)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      })
    }, container)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0F]"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="aurora-orb absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-[#6D28D9]/20 blur-[120px]" />
        <div className="aurora-orb absolute bottom-1/3 -right-20 w-[600px] h-[600px] rounded-full bg-[#2563EB]/15 blur-[140px]" />
        <div className="aurora-orb absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-[#5B21B6]/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#6D28D9/8%,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-24 pb-20">
        <div ref={textRef} className="mb-8">
          <div className="hero-line inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50 text-xs tracking-widest uppercase mb-8 opacity-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            IA para clínicas de estética y bienestar
          </div>

          <h1 className="hero-line text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-[-0.04em] text-white mb-6 opacity-0">
            Tu negocio
            <br />
            <span className="gradient-brand">responde solo.</span>
          </h1>

          <p className="hero-line text-lg sm:text-xl text-white/40 max-w-2xl mx-auto leading-relaxed opacity-0">
            Bookia conecta WhatsApp, Instagram y Facebook con IA para convertir
            conversaciones en citas agendadas. Sin errores. Sin demoras. 24/7.
          </p>
        </div>

        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
          <Link href="/login" className="hero-cta-item opacity-0">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#6D28D9] to-[#2563EB] hover:from-[#7C3AED] hover:to-[#3B82F6] text-white px-8 h-12 text-base rounded-xl shadow-2xl shadow-[#6D28D9]/25 animate-pulse-glow"
            >
              Ver demo <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <a href="#como-funciona" className="hero-cta-item opacity-0">
            <Button
              size="lg"
              variant="outline"
              className="px-8 h-12 text-base rounded-xl border-white/[0.12] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white transition-all duration-300"
            >
              Conocer más
            </Button>
          </a>
        </div>

        <div className="hero-cta-item mt-16 flex flex-wrap justify-center gap-8 sm:gap-16 opacity-0">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white">&lt;5s</div>
            <div className="text-xs sm:text-sm text-white/30 mt-1">tiempo de respuesta</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white">68%</div>
            <div className="text-xs sm:text-sm text-white/30 mt-1">tasa de conversión</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white">24/7</div>
            <div className="text-xs sm:text-sm text-white/30 mt-1">atención automática</div>
          </div>
        </div>
      </div>
    </section>
  )
}
