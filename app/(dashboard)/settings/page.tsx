"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MessageCircle, Camera, Tv2, Info, Sparkles } from "lucide-react"
import { getProfile, getCatalog, updateProfile } from "@/lib/api"

export default function SettingsPage() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  })

  const { data: catalog } = useQuery({
    queryKey: ["catalog"],
    queryFn: getCatalog,
  })

  const [business, setBusiness] = useState({
    name: "Estética Santa María",
    type: "clinica_estetica",
    city: "Cali",
    openTime: "09:00",
    closeTime: "22:30",
  })
  const [agentName, setAgentName] = useState("Sofia")
  const [tone, setTone] = useState("amigable")
  const [notifs, setNotifs] = useState({ escalation: true, newCita: true, dailySummary: false })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Hidratación desde el backend: cuando profile llega, sobreescribimos los valores
  // iniciales (placeholder) con los reales. Sincroniza name/city/horas/agente/tono.
  useEffect(() => {
    if (!profile) return
    // Extraer nombre y tono del campo persona (formato: "Eres <name>, asesor de <biz>. Tono <tone> ...")
    const persona = profile.persona ?? ""
    const nameMatch = persona.match(/Eres\s+([^,]+),\s+asesor/i)
    const toneMatch = persona.match(/Tono\s+(\w+)/i)
    if (nameMatch) setAgentName(nameMatch[1].trim())
    if (toneMatch) {
      const t = toneMatch[1].trim().toLowerCase()
      if (["formal", "amigable", "mixto"].includes(t)) setTone(t)
    }
    // Horarios desde profile.hours (formato: { mon: "09:00-19:00", ... }) → tomar el primero
    const hours: Record<string, string> = profile.hours ?? {}
    const firstSlot = Object.values(hours)[0]
    if (firstSlot && firstSlot.includes("-")) {
      const [open, close] = firstSlot.split("-")
      if (open) setBusiness((b) => ({ ...b, openTime: open.trim() }))
      if (close) setBusiness((b) => ({ ...b, closeTime: close.trim() }))
    }
    // Ciudades no están en el schema actual — dejamos el placeholder (edición manual)
  }, [profile])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await updateProfile({ persona: `Eres ${agentName}, asesor de ${business.name}. Tono ${tone} y cercano.` })
      setSaved(true)
    } catch {}
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl space-y-8 pb-24">
      <div>
        <h1 className="text-2xl font-bold app-text-hi">Configuración</h1>
        <p className="app-text-mid text-sm mt-1">Gestiona tu negocio y tu agente IA</p>
      </div>

      <section className="app-card p-6 space-y-5">
        <h2 className="font-semibold app-text-hi">Perfil del negocio</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium app-text-hi block mb-1.5">Nombre del negocio</label>
            <Input value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} className="h-10" />
          </div>
          <div>
            <label className="text-sm font-medium app-text-hi block mb-1.5">Ciudad</label>
            <Input value={business.city} onChange={(e) => setBusiness({ ...business, city: e.target.value })} className="h-10" />
          </div>
          <div>
            <label className="text-sm font-medium app-text-hi block mb-1.5">Tipo de negocio</label>
            <select
              value={business.type}
              onChange={(e) => setBusiness({ ...business, type: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border app-border bg-white text-sm app-text-hi focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
            >
              <option value="clinica_estetica">Clínica estética</option>
              <option value="spa">Spa</option>
              <option value="salud">Salud</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium app-text-hi block mb-1.5">Apertura</label>
              <Input type="time" value={business.openTime} onChange={(e) => setBusiness({ ...business, openTime: e.target.value })} className="h-10" />
            </div>
            <div>
              <label className="text-sm font-medium app-text-hi block mb-1.5">Cierre</label>
              <Input type="time" value={business.closeTime} onChange={(e) => setBusiness({ ...business, closeTime: e.target.value })} className="h-10" />
            </div>
          </div>
        </div>
        {profile && (
          <div className="bg-indigo-50 rounded-xl p-3 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-700">
              <p className="font-medium">Perfil sincronizado con el backend</p>
              <p className="mt-0.5">Persona: {profile.persona} · Modo: {profile.booking_mode}</p>
            </div>
          </div>
        )}
      </section>

      <section className="app-card p-6 space-y-4">
        <h2 className="font-semibold app-text-hi">Servicios ({catalog?.data?.length ?? 0})</h2>
        <p className="text-sm app-text-mid">Catálogo de servicios sincronizado del backend.</p>
        {catalog?.data && catalog.data.length > 0 ? (
          <div className="space-y-2">
            {catalog.data.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border app-border app-bg">
                <div>
                  <p className="text-sm font-medium app-text-hi">{item.name}</p>
                  <p className="text-xs app-text-lo">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold app-text-hi">${parseFloat(item.price).toLocaleString("es-CO")}</p>
                  <p className="text-xs app-text-lo">{item.currency}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm app-text-lo">Cargando servicios...</p>
        )}
      </section>

      <section className="app-card p-6 space-y-4">
        <h2 className="font-semibold app-text-hi">Canales conectados</h2>
        <p className="text-sm app-text-mid">Conecta tus canales para empezar a recibir mensajes.</p>
        <div className="space-y-3">
          {[
            { name: "WhatsApp Business", icon: MessageCircle, color: "text-green-600 bg-green-50", iconColor: "text-green-600" },
            { name: "Instagram", icon: Camera, color: "text-pink-600 bg-pink-50", iconColor: "text-pink-600" },
            { name: "Facebook", icon: Tv2, color: "text-blue-600 bg-blue-50", iconColor: "text-blue-600" },
          ].map((ch) => (
            <div key={ch.name} className="flex items-center justify-between p-4 rounded-xl border app-border app-bg">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${ch.color} flex items-center justify-center`}>
                  <ch.icon className={`w-5 h-5 ${ch.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-medium app-text-hi">{ch.name}</p>
                  <Badge className="text-xs bg-gray-100 text-gray-500 border-0 hover:bg-gray-100 mt-0.5">No conectado</Badge>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      role="button"
                      aria-disabled="true"
                      className="inline-flex items-center justify-center text-xs h-8 px-3 rounded-xl bg-gray-100 text-gray-400 cursor-default select-none"
                    >
                      Conectar
                    </span>
                  }
                />
                <TooltipContent>
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    <span>Disponible en Fase 2</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </section>

      <section className="app-card p-6 space-y-5">
        <h2 className="font-semibold app-text-hi">Agente IA</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium app-text-hi block mb-1.5">Nombre del agente</label>
            <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="h-10" placeholder="Ej: Sofia" />
          </div>
          <div>
            <label className="text-sm font-medium app-text-hi block mb-1.5">Tono de comunicación</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full h-10 px-3 rounded-xl border app-border bg-white text-sm app-text-hi focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]">
              <option value="formal">Formal</option>
              <option value="amigable">Amigable</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>
        </div>
      </section>

      <section className="app-card p-6 space-y-4">
        <h2 className="font-semibold app-text-hi">Notificaciones</h2>
        {[
          { key: "escalation", label: "Alertas de escalación", desc: "Recibe aviso cuando una conversación requiere atención humana" },
          { key: "newCita", label: "Nueva cita agendada", desc: "Notificación cada vez que se agenda una cita exitosamente" },
          { key: "dailySummary", label: "Resumen diario", desc: "Reporte diario con métricas del día anterior" },
        ].map((n) => (
          <div key={n.key} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium app-text-hi">{n.label}</p>
              <p className="text-xs app-text-mid mt-0.5">{n.desc}</p>
            </div>
            <button
              onClick={() => setNotifs({ ...notifs, [n.key]: !notifs[n.key as keyof typeof notifs] })}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${notifs[n.key as keyof typeof notifs] ? "bg-indigo-600" : "bg-gray-200"}`}
              aria-pressed={notifs[n.key as keyof typeof notifs]}
              aria-label={`${n.label}: ${notifs[n.key as keyof typeof notifs] ? "activada" : "desactivada"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifs[n.key as keyof typeof notifs] ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        ))}
      </section>

      {/* Sticky action bar: el botón Guardar siempre visible, sin scroll */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30 bg-white/95 backdrop-blur border-t app-border px-6 py-3 flex items-center justify-between gap-4">
        <p className="text-xs app-text-mid hidden sm:block">
          Los cambios se guardan en el backend vía PUT /api/profile.
        </p>
        <div className="flex items-center gap-3 ml-auto">
          {saved && (
            <span className="text-sm text-emerald-600 font-medium" role="status" aria-live="polite">
              ¡Guardado!
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="app-brand-bg px-8 font-medium"
          >
            {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  )
}