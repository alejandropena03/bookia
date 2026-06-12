export default function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-white/[0.04] bg-[#0A0A0F]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img
            src="/bookia-wordmark.svg"
            alt="Bookia"
            className="h-5 w-auto opacity-50"
          />
        </div>

        <div className="flex gap-6 text-sm text-white/30">
          <a href="#" className="hover:text-white/60 transition-colors duration-300">
            Términos
          </a>
          <a href="#" className="hover:text-white/60 transition-colors duration-300">
            Privacidad
          </a>
          <a href="mailto:hola@bookia.co" className="hover:text-white/60 transition-colors duration-300">
            Contacto
          </a>
        </div>

        <p className="text-sm text-white/20">© 2026 Bookia. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
