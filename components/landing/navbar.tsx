"use client"

import { useRef, useEffect, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

gsap.registerPlugin(ScrollTrigger)

const NAV_LINKS = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Características", href: "#caracteristicas" },
  { label: "Precios", href: "#precios" },
]

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: "top -80",
        onEnter: () => setScrolled(true),
        onLeaveBack: () => setScrolled(false),
      })
    }, nav)

    return () => ctx.revert()
  }, [])

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#08070C]/80 backdrop-blur-2xl border-b border-white/[0.06] py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 flex items-center justify-between">
        <Link href="/" className="flex items-center group" aria-label="Bookia inicio">
          <Image
            src="/bookia-wordmark.svg"
            alt="Bookia"
            width={150}
            height={44}
            className="h-9 w-auto transition-opacity duration-300 group-hover:opacity-80"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-base text-mid hover:text-hi transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </div>

        <Link href="/login">
          <Button className="bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-[#8B5CF6] hover:to-[#3B82F6] text-white text-base px-6 h-11 rounded-xl shadow-lg shadow-[#6D28D9]/20 hover:shadow-[#6D28D9]/30 transition-all duration-300">
            Acceder
          </Button>
        </Link>
      </div>
    </nav>
  )
}
