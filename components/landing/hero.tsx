"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      if (!prefersReduced) {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

        tl.fromTo(".hero-badge",
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6 })
          .fromTo(".hero-headline",
            { y: 40, opacity: 0, filter: "blur(6px)" },
            { y: 0, opacity: 1, filter: "blur(0px)", stagger: 0.12, duration: 0.9 }, "-=0.3")
          .fromTo(".hero-sub",
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8 }, "-=0.5")
          .fromTo(".hero-cta-item",
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.6 }, "-=0.4")
          .fromTo(".hero-stat",
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.08, duration: 0.6 }, "-=0.3")
      } else {
        gsap.set([".hero-badge", ".hero-headline", ".hero-sub", ".hero-cta-item", ".hero-stat"],
          { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" })
      }

      // Aurora orbs: deriva orgánica continua
      gsap.to(".aurora-orb", {
        x: "random(-40, 40)",
        y: "random(-30, 30)",
        scale: "random(0.85, 1.15)",
        duration: "random(7, 12)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: { each: 0.5, from: "random" },
      })

      // Parallax sutil del contenido al hacer scroll
      if (!prefersReduced) {
        gsap.to(".hero-content", {
          y: 120,
          opacity: 0.3,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        })
      }
    }, container)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#08070C] grain-overlay"
    >
      {/* Grid técnico de fondo con máscara radial */}
      <div className="absolute inset-0 bg-grid mask-fade-edges pointer-events-none" />

      {/* Orbes aurora */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="aurora-orb absolute top-[15%] -left-32 w-[560px] h-[560px] rounded-full bg-[#7C3AED]/25 blur-[130px]" />
        <div className="aurora-orb absolute bottom-[20%] -right-32 w-[640px] h-[640px] rounded-full bg-[#2563EB]/20 blur-[150px]" />
        <div className="aurora-orb absolute top-[45%] left-[35%] w-[420px] h-[420px] rounded-full bg-[#5B21B6]/15 blur-[110px]" />
      </div>

      {/* Viñeta superior/inferior para profundidad */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#08070C] to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0A0A0F] to-transparent pointer-events-none" />

      <div className="hero-content relative z-10 max-w-5xl mx-auto px-5 text-center pt-28 pb-24">
        <div className="hero-badge inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm text-mid text-xs tracking-wide mb-9 opacity-0">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Agente de IA para negocios que viven de responder y agendar
        </div>

        <h1 className="text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold leading-[0.92] tracking-[-0.045em] text-hi mb-7">
          <span className="hero-headline block opacity-0">Convierte cada mensaje</span>
          <span className="hero-headline block gradient-brand opacity-0 pb-2">en una cita.</span>
        </h1>

        <p className="hero-sub text-lg sm:text-xl text-mid max-w-2xl mx-auto leading-relaxed opacity-0">
          Bookia responde tus conversaciones de WhatsApp, Instagram y Facebook
          en segundos, agenda las citas por ti y te muestra cómo crece tu negocio.
          <span className="text-hi"> Humano, pero sin errores. 24/7.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center mt-11">
          <Link href="/login" className="hero-cta-item opacity-0">
            <Button
              size="lg"
              className="group bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-[#8B5CF6] hover:to-[#3B82F6] text-white px-8 h-12 text-base rounded-xl shadow-2xl shadow-[#6D28D9]/30 animate-pulse-glow transition-all"
            >
              Ver demo en vivo
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <a href="#como-funciona" className="hero-cta-item opacity-0">
            <Button
              size="lg"
              variant="outline"
              className="px-8 h-12 text-base rounded-xl border-white/12 bg-white/[0.03] text-mid hover:bg-white/[0.07] hover:text-hi backdrop-blur-sm transition-all duration-300"
            >
              Cómo funciona
            </Button>
          </a>
        </div>

        <div className="mt-20 flex flex-wrap justify-center gap-10 sm:gap-20">
          {[
            { v: "<5s", l: "tiempo de respuesta" },
            { v: "68%", l: "conversación a cita" },
            { v: "24/7", l: "atención automática" },
          ].map((s) => (
            <div key={s.l} className="hero-stat text-center opacity-0">
              <div className="text-3xl sm:text-4xl font-bold text-hi tabular-nums tracking-tight">{s.v}</div>
              <div className="text-xs sm:text-sm text-lo mt-1.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
