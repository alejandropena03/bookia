"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ businessName: "", email: "", password: "", businessType: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.businessName) e.businessName = "El nombre del negocio es obligatorio"
    if (!form.email) e.email = "El email es obligatorio"
    if (!form.password || form.password.length < 6) e.password = "La contraseña debe tener al menos 6 caracteres"
    if (!form.businessType) e.businessType = "Selecciona el tipo de negocio"
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8787/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: form.businessName, email: form.email, password: form.password }),
      })
      if (!res.ok) { setErrors({ form: "Error al crear cuenta. Intenta de nuevo." }); return }
      router.push("/login?registered=1")
    } catch {
      setErrors({ form: "Error de conexión con el servidor." })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/bookia-wordmark.svg" alt="Bookia" width={120} height={32} className="h-7 w-auto" />
          </Link>
          <p className="app-text-mid mt-3 text-sm">Crea tu cuenta gratis</p>
        </div>

        <div className="app-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium app-text-hi block mb-1.5">Nombre del negocio</label>
              <Input
                placeholder="Ej: Estética Santa María"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="h-11"
              />
              {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
            </div>
            <div>
              <label className="text-sm font-medium app-text-hi block mb-1.5">Email</label>
              <Input
                type="email"
                placeholder="tu@negocio.co"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-11"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm font-medium app-text-hi block mb-1.5">Contraseña</label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-11"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="text-sm font-medium app-text-hi block mb-1.5">Tipo de negocio</label>
              <select
                value={form.businessType}
                onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                className="w-full h-11 px-3 rounded-xl border app-border bg-white text-sm app-text-hi focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
              >
                <option value="">Selecciona una opción</option>
                <option value="clinica_estetica">Clínica estética</option>
                <option value="spa">Spa</option>
                <option value="salud">Salud</option>
                <option value="otro">Otro</option>
              </select>
              {errors.businessType && <p className="text-xs text-red-500 mt-1">{errors.businessType}</p>}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 app-brand-bg font-medium"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
            </Button>
          </form>
          <p className="text-center text-sm app-text-mid mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="app-brand font-medium hover:opacity-80">
              Ingresar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
