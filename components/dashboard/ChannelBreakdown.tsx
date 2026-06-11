"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface Channels {
  whatsapp: { porcentaje: number; total_mensajes: number; total_citas: number }
  instagram: { porcentaje: number; total_mensajes: number; total_citas: number }
  facebook: { porcentaje: number; total_mensajes: number; total_citas: number }
}

const COLORS = ["#25D366", "#E1306C", "#1877F2"]

export default function ChannelBreakdown({ channels }: { channels: Channels }) {
  const data = [
    { name: "WhatsApp", mensajes: channels.whatsapp.total_mensajes, citas: channels.whatsapp.total_citas },
    { name: "Instagram", mensajes: channels.instagram.total_mensajes, citas: channels.instagram.total_citas },
    { name: "Facebook", mensajes: channels.facebook.total_mensajes, citas: channels.facebook.total_citas },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }} />
        <Bar dataKey="citas" name="Citas" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
