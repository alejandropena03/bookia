"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import Image from "next/image"
import {
  LayoutDashboard, MessageSquare, Calendar, BarChart2, Settings,
  Menu, X, LogOut, Bell, ChevronDown,
} from "lucide-react"
import { QueryProvider } from "@/app/providers"
import DemoLive from "@/components/dashboard/DemoLive"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/conversations", label: "Conversaciones", icon: MessageSquare },
  { href: "/agenda", label: "Agenda", icon: Calendar, soon: true },
  { href: "/analytics", label: "Analítica", icon: BarChart2, soon: true },
  { href: "/settings", label: "Configuración", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <QueryProvider>
      <div className="flex h-screen app-bg app-text-hi overflow-hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 app-surface app-border flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          <div className="h-16 flex items-center px-6 border-b app-border">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/bookia-wordmark.svg" alt="Bookia" width={96} height={28} className="h-6 w-auto" />
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              return item.soon ? (
                <div key={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg app-text-lo cursor-not-allowed">
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                  <Badge className="ml-auto text-xs bg-gray-100 text-gray-400 hover:bg-gray-100 border-0 py-0">Próximamente</Badge>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "app-text-mid hover:bg-white/60 hover:text-app-text-hi"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${active ? "text-indigo-600" : ""}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t app-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">SM</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium app-text-hi truncate">Estética Santa María</p>
                <p className="text-xs app-text-lo">Plan Growth</p>
              </div>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="app-text-lo hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 app-surface app-border flex items-center px-4 gap-4 shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden app-text-mid">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <button className="relative app-text-mid hover:text-app-text-hi transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full text-white text-[10px] flex items-center justify-center font-bold">3</span>
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">SM</AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium app-text-hi">Admin</span>
              <ChevronDown className="w-4 h-4 app-text-mid" />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
      <DemoLive />
    </QueryProvider>
  )
}
