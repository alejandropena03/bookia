"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/bookia-wordmark.svg" alt="Bookia" width={120} height={32} className="h-7 w-auto" />
          </Link>
          <p className="app-text-mid mt-3 text-sm">Ingresa a tu cuenta</p>
        </div>

        <div className="app-card p-8 space-y-5">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
            <p className="text-xs app-text-mid font-medium mb-1">Credenciales de demo</p>
            <code className="text-xs font-mono app-brand font-semibold">admin@bookia.co</code>
            <span className="mx-2 text-indigo-300">/</span>
            <code className="text-xs font-mono app-brand font-semibold">bookia2024</code>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium app-text-hi block mb-1.5">Email</label>
              <Input
                type="email"
                placeholder="tu@negocio.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium app-text-hi block mb-1.5">Contraseña</label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 app-text-lo hover:app-text-mid"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
            )}
            <Button type="submit" disabled={loading} className="w-full h-11 app-brand-bg font-medium">
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
          <p className="text-center text-sm app-text-mid">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="app-brand font-medium hover:opacity-80">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
