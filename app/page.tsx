import Link from "next/link"
import { CheckCircle2, MessageCircle, Bot, BarChart3, Calendar, Bell, TrendingUp, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-[#0F172A]">Bookia</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#64748B]">
            <a href="#producto" className="hover:text-[#0F172A] transition-colors">Producto</a>
            <a href="#precios" className="hover:text-[#0F172A] transition-colors">Precios</a>
            <Link href="/login" className="hover:text-[#0F172A] transition-colors">Demo</Link>
          </div>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm">
              Empezar gratis
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50">
            ✨ IA para negocios de belleza y estética
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-[#0F172A] leading-tight mb-6">
            Tu negocio responde solo.{" "}
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Tus clientes agendan solos.
            </span>
          </h1>
          <p className="text-xl text-[#64748B] max-w-2xl mx-auto mb-10 leading-relaxed">
            Bookia conecta WhatsApp, Instagram y Facebook con IA para convertir
            conversaciones en citas agendadas automáticamente. Sin errores, sin demoras.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 text-base">
                Ver demo <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button size="lg" variant="outline" className="px-8 text-base border-gray-200">
                Conocer más
              </Button>
            </a>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0F172A]">68%</div>
              <div className="text-sm text-[#64748B] mt-1">tasa de conversión</div>
            </div>
            <div className="text-center border-x border-gray-100">
              <div className="text-3xl font-bold text-[#0F172A]">&lt;2min</div>
              <div className="text-sm text-[#64748B] mt-1">tiempo de respuesta</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0F172A]">24/7</div>
              <div className="text-sm text-[#64748B] mt-1">atención automática</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0F172A] mb-4">El problema que te cuesta clientes</h2>
            <p className="text-[#64748B] text-lg">Cada mensaje sin respuesta es una cita perdida.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "❌", title: "Respuestas lentas", desc: "Tus operadores no pueden atender todos los mensajes en horario pico. Los clientes se van con la competencia." },
              { icon: "❌", title: "Sin métricas", desc: "No sabes cuántos mensajes recibes, cuántos se convierten en citas, ni de qué canal viene más negocio." },
              { icon: "❌", title: "Errores humanos", desc: "Citas dobles, datos mal tomados, recordatorios olvidados. La operación manual tiene un techo." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-[#0F172A] mb-2">{item.title}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0F172A] mb-4">Cómo funciona Bookia</h2>
            <p className="text-[#64748B] text-lg">Cuatro pasos. Sin fricción técnica.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { step: "01", title: "Conecta tus canales", desc: "Vincula WhatsApp Business, Instagram y Facebook en minutos. Un solo inbox para todo." },
              { step: "02", title: "La IA responde y clasifica", desc: "Bookia entiende la intención de cada mensaje y responde con el contexto de tu negocio." },
              { step: "03", title: "Tu equipo valida y confirma", desc: "Un humano aprueba cada respuesta antes de enviar. Control total sin esfuerzo extra." },
              { step: "04", title: "La cita queda en tu agenda", desc: "La cita se registra automáticamente en tu software de agenda con todos los datos." },
            ].map((item) => (
              <div key={item.step} className="flex gap-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-1">{item.title}</h3>
                  <p className="text-[#64748B] text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="producto" className="py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0F172A] mb-4">Todo lo que necesitas para crecer</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: MessageCircle, title: "Inbox unificado", desc: "WhatsApp, Instagram y Facebook en un solo lugar. Sin cambiar de app." },
              { icon: Bot, title: "IA contextual", desc: "Respuestas inteligentes basadas en tus servicios, precios y disponibilidad." },
              { icon: BarChart3, title: "Dashboard en tiempo real", desc: "Métricas de conversión, canales y tiempo de respuesta visibles siempre." },
              { icon: Calendar, title: "Agendamiento directo", desc: "Las citas van directo a tu software de agenda sin doble digitación." },
              { icon: Bell, title: "Recordatorios automáticos", desc: "Reducción de no-shows con recordatorios 24h y 2h antes de cada cita." },
              { icon: TrendingUp, title: "Analítica por canal", desc: "Descubre qué canal te genera más negocio y optimiza tu inversión." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-[#0F172A] mb-2">{item.title}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0F172A] mb-4">Precios simples y transparentes</h2>
            <p className="text-[#64748B] text-lg">Sin costos ocultos. Sin contratos largos.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "$99.000", period: "COP/mes", desc: "Para negocios que están empezando", features: ["Hasta 500 mensajes/mes", "1 canal (WhatsApp)", "Dashboard básico", "Soporte por email"], highlight: false },
              { name: "Growth", price: "$249.000", period: "COP/mes", desc: "Para negocios en crecimiento", features: ["Hasta 2.000 mensajes/mes", "3 canales (WA + IG + FB)", "Dashboard completo", "Analítica avanzada", "Soporte prioritario"], highlight: true },
              { name: "Pro", price: "$499.000", period: "COP/mes", desc: "Para equipos con alto volumen", features: ["Mensajes ilimitados", "3 canales + más próximamente", "Todo lo de Growth", "Múltiples operadores", "Integraciones avanzadas"], highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-6 border ${plan.highlight ? "border-indigo-200 bg-gradient-to-b from-indigo-50 to-white shadow-lg ring-2 ring-indigo-600" : "border-gray-100 bg-white shadow-sm"}`}>
                {plan.highlight && <Badge className="mb-3 bg-indigo-600 text-white hover:bg-indigo-600">Más popular</Badge>}
                <h3 className="font-bold text-[#0F172A] text-xl">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-3xl font-bold text-[#0F172A]">{plan.price}</span>
                  <span className="text-[#64748B] text-sm ml-1">{plan.period}</span>
                </div>
                <p className="text-[#64748B] text-sm mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#0F172A]">
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button className={`w-full ${plan.highlight ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white" : "bg-white border border-gray-200 text-[#0F172A] hover:bg-gray-50"}`}>
                    Empezar ahora
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-[#64748B] mt-8">¿Eres una clínica piloto? Contáctanos para condiciones especiales.</p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¿Listo para automatizar tu negocio?</h2>
          <p className="text-purple-100 text-lg mb-8">Únete a los negocios que ya convierten conversaciones en citas.</p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-50 px-10 font-semibold">
              Empezar ahora <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#0F172A]">Bookia</span>
          </div>
          <div className="flex gap-6 text-sm text-[#64748B]">
            <a href="#" className="hover:text-[#0F172A]">Términos</a>
            <a href="#" className="hover:text-[#0F172A]">Privacidad</a>
            <a href="#" className="hover:text-[#0F172A]">Contacto</a>
          </div>
          <p className="text-sm text-[#64748B]">© 2026 Bookia. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
