"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface Channels {
  whatsapp: { porcentaje: number; total_mensajes: number; total_citas: number }
  instagram: { porcentaje: number; total_mensajes: number; total_citas: number }
  facebook: { porcentaje: number; total_mensajes: number; total_citas: number }
}

const COLORS = ["#6D28D9", "#2563EB", "#8B5CF6"]

export default function ChannelBreakdown({ channels }: { channels: Channels }) {
  const data = [
    { name: "WhatsApp", mensajes: channels.whatsapp.total_mensajes, citas: channels.whatsapp.total_citas },
    { name: "Instagram", mensajes: channels.instagram.total_mensajes, citas: channels.instagram.total_citas },
    { name: "Facebook", mensajes: channels.facebook.total_mensajes, citas: channels.facebook.total_citas },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E8EF" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#A1A1AA" }} />
        <YAxis tick={{ fontSize: 11, fill: "#A1A1AA" }} />
        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E8E8EF", fontSize: "12px" }} />
        <Bar dataKey="citas" name="Citas" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
