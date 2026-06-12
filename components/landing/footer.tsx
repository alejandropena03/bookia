import Image from "next/image"

export default function Footer() {
  return (
    <footer className="py-16 px-6 sm:px-10 border-t border-white/[0.04] bg-[#0A0A0F]">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Image
          src="/bookia-wordmark.svg"
          alt="Bookia"
          width={130}
          height={38}
          className="h-8 w-auto"
        />

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
