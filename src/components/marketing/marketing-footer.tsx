import Link from "next/link"

const FOOTER_LINKS = {
  Especialidades: [
    { label: "Psicología Clínica", href: "/especialidades/psicologia-clinica" },
    { label: "Neuropsicología", href: "/especialidades/neuropsicologia" },
    { label: "Psicología Forense", href: "/especialidades/psicologia-forense" },
    { label: "Organizacional", href: "/especialidades/psicologia-organizacional" },
    { label: "Infantojuvenil", href: "/especialidades/psicologia-infantojuvenil" },
    { label: "Ver las 12", href: "/especialidades" },
  ],
  Academia: [
    { label: "Catálogo Completo", href: "/academia" },
    { label: "Eventos en Vivo", href: "/eventos" },
  ],
  Recursos: [
    { label: "Blog", href: "/blog" },
    { label: "Recursos Gratuitos", href: "/recursos" },
    { label: "Casos de Estudio", href: "/casos-de-exito" },
  ],
  Empresa: [
    { label: "Nosotros", href: "/nosotros" },
    { label: "Manifiesto", href: "/manifiesto" },
    { label: "Investigación", href: "/nosotros" },
    { label: "Comunidad", href: "/comunidad" },
  ],
  Legal: [
    { label: "Términos de Servicio", href: "/terminos" },
    { label: "Aviso de Privacidad", href: "/aviso-privacidad" },
  ],
}

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/30 dark:bg-[#050505]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-3 md:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black dark:bg-white">
                <span className="text-[#f6ae02] dark:text-black font-bold text-[10px] tracking-tighter">SH</span>
              </div>
              <span className="text-base font-bold tracking-[1px] uppercase">
                SAPIHUM
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Psicología Avanzada e Investigación Humana. La plataforma integral para profesionales de la psicología.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 text-sm font-bold text-foreground uppercase tracking-wider">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-[#f6ae02]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t py-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground font-semibold">
            &copy; {new Date().getFullYear()} SAPIHUM — Psicología Avanzada e Investigación Humana. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Construido con ciencia para la comunidad de salud mental
          </p>
        </div>
      </div>
    </footer>
  )
}
