"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!email) { setError("El email es obligatorio"); return }
    if (!password) { setError("La contraseña es obligatoria"); return }
    setLoading(true)
    const result = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError("Email o contraseña incorrectos")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-[#0F172A]">Bookia</span>
          </Link>
          <p className="text-[#64748B] mt-3 text-sm">Ingresa a tu cuenta</p>
        </div>

        {/* Demo badge */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-indigo-700 font-medium mb-1">Credenciales de demo</p>
          <Badge variant="outline" className="text-xs font-mono border-indigo-200 text-indigo-600">admin@bookia.co</Badge>
          <span className="mx-2 text-indigo-400">/</span>
          <Badge variant="outline" className="text-xs font-mono border-indigo-200 text-indigo-600">bookia2024</Badge>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-[#0F172A] block mb-2">Email</label>
              <Input
                type="email"
                placeholder="tu@negocio.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#0F172A] block mb-2">Contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
          <p className="text-center text-sm text-[#64748B] mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
