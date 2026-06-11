"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
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
    await new Promise((r) => setTimeout(r, 800))
    router.push("/login?registered=1")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-[#0F172A]">Bookia</span>
          </Link>
          <p className="text-[#64748B] mt-3 text-sm">Crea tu cuenta gratis</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-[#0F172A] block mb-2">Nombre del negocio</label>
              <Input
                placeholder="Ej: Estética Santa María"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="h-11"
              />
              {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-[#0F172A] block mb-2">Email</label>
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
              <label className="text-sm font-medium text-[#0F172A] block mb-2">Contraseña</label>
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
              <label className="text-sm font-medium text-[#0F172A] block mb-2">Tipo de negocio</label>
              <select
                value={form.businessType}
                onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
            </Button>
          </form>
          <p className="text-center text-sm text-[#64748B] mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Ingresar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
