"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, MessageSquare, Calendar, BarChart2, Settings,
  CheckCircle2, Menu, X, LogOut, Bell, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-[#0F172A]">Bookia</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            return item.soon ? (
              <div key={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#94A3B8] cursor-not-allowed">
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
                    : "text-[#64748B] hover:bg-gray-50 hover:text-[#0F172A]"
                }`}
              >
                <item.icon className={`w-4 h-4 ${active ? "text-indigo-600" : ""}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">SM</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0F172A] truncate">Estética Santa María</p>
              <p className="text-xs text-[#64748B]">Plan Growth</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-[#94A3B8] hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-4 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-[#64748B]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button className="relative text-[#64748B] hover:text-[#0F172A] transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full text-white text-[10px] flex items-center justify-center">3</span>
          </button>
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">SM</AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-[#0F172A]">Estética Santa María</span>
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
