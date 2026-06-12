import Image from "next/image"

export default function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-white/[0.04] bg-[#0A0A0F]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <Image
            src="/bookia-icon.jpeg"
            alt=""
            width={20}
            height={20}
            className="rounded ring-1 ring-white/10"
          />
          <span className="text-hi text-sm font-semibold">Bookia</span>
        </div>

        <div className="flex gap-6 text-sm text-lo">
          <a href="#" className="hover:text-hi transition-colors duration-300">
            Términos
          </a>
          <a href="#" className="hover:text-hi transition-colors duration-300">
            Privacidad
          </a>
          <a href="mailto:hola@bookia.co" className="hover:text-hi transition-colors duration-300">
            Contacto
          </a>
        </div>

        <p className="text-sm text-lo">© 2026 Bookia. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
