"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MessageCircle, Camera, Tv2, Info } from "lucide-react"

export default function SettingsPage() {
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

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-8">
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
            <select defaultValue={business.type} className="w-full h-10 px-3 rounded-xl border app-border bg-white text-sm app-text-hi focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]">
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
                <TooltipTrigger>
                  <Button size="sm" disabled className="text-xs h-8 bg-gray-100 text-gray-400 cursor-default">
                    Conectar
                  </Button>
                </TooltipTrigger>
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
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifs[n.key as keyof typeof notifs] ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        ))}
      </section>

      <Button
        onClick={handleSave}
        className="app-brand-bg px-8 font-medium"
      >
        {saved ? "¡Guardado!" : "Guardar cambios"}
      </Button>
    </div>
  )
}
